import { shiftDate } from "../../lib/window";
import type {
  AdPlatformAdapter,
  InsightRecord,
  MetaInsightRow,
} from "../../platforms/meta";
import { aggregateInsightsByDate, normalizeInsight } from "../../platforms/meta";
import type { AdAccount } from "@wk/db";
import type { AdAccountsModel, InsightUpsertRow } from "./model";
import {
  createEmptySummary,
  createStageRunner,
  runStructureStages,
  toMetaError,
} from "./stages";
import { SyncCancelledError } from "./stages";
import type { RemovedSummary, SyncRunHooks, SyncStage, SyncSummary } from "./stages";
import { adapterOrNull, ensureNotRateLimited, pendingTokenError } from "./account-access";

export const BACKFILL_MIN_MONTHS = 1;
export const BACKFILL_MAX_MONTHS = 24;
export const BACKFILL_CHUNK_DAYS = 30;
export const BACKFILL_DEFAULT_MONTHS = 12;

export interface BackfillSummary {
  months: number;
  chunksTotal: number;
  chunksDone: number;
  structure: { campaigns: number; adSets: number; ads: number };
  removed: RemovedSummary;
  graphCalls: number;
}

export type BackfillOutcome =
  | { ok: true; summary: BackfillSummary }
  | { ok: false; failedStage: SyncStage; errorClass: string };

export function clampBackfillMonths(value: number): number {
  if (!Number.isFinite(value)) {
    return BACKFILL_DEFAULT_MONTHS;
  }
  return Math.min(
    BACKFILL_MAX_MONTHS,
    Math.max(BACKFILL_MIN_MONTHS, Math.floor(value))
  );
}

const LEVEL_KEYS: {
  level: "campaign" | "adset" | "ad";
  key: "campaign_id" | "adset_id" | "ad_id";
}[] = [
  { level: "campaign", key: "campaign_id" },
  { level: "adset", key: "adset_id" },
  { level: "ad", key: "ad_id" },
];

interface ChunkWindows {
  chunk: number;
  chunksTotal: number;
  since: string;
  until: string;
}

export function backfillChunkWindows(today: string, months: number): ChunkWindows[] {
  const chunksTotal = months;
  const totalDays = months * BACKFILL_CHUNK_DAYS;
  const overallSince = shiftDate(today, -(totalDays - 1));
  const windows: ChunkWindows[] = [];
  for (let chunk = 1; chunk <= chunksTotal; chunk += 1) {
    const until = shiftDate(today, -(chunksTotal - chunk) * BACKFILL_CHUNK_DAYS);
    const sinceCandidate = shiftDate(until, -(BACKFILL_CHUNK_DAYS - 1));
    windows.push({
      chunk,
      chunksTotal,
      since: sinceCandidate < overallSince ? overallSince : sinceCandidate,
      until,
    });
  }
  return windows;
}

async function pullChunk(
  model: AdAccountsModel,
  account: AdAccount,
  meta: AdPlatformAdapter,
  currency: string,
  windows: ChunkWindows,
  idsByLevel: Record<"campaign" | "adset" | "ad", Map<string, string>>
): Promise<InsightUpsertRow[]> {
  const insightRows: InsightUpsertRow[] = [];
  const campaignLevelRecords: InsightRecord[] = [];
  for (const entry of LEVEL_KEYS) {
    const rows = await meta.getInsights(account.adAccountId, entry.level, {
      since: windows.since,
      until: windows.until,
    });
    appendLevelRows(entry.level, entry.key, rows, idsByLevel[entry.level], insightRows, campaignLevelRecords);
  }
  const accountDaily = aggregateInsightsByDate(campaignLevelRecords);
  for (const record of accountDaily.values()) {
    insightRows.push({ entityLevel: "account", entityId: account.id, record });
  }
  await model.upsertInsights(account.id, currency, insightRows);
  return insightRows;
}

function appendLevelRows(
  level: "campaign" | "adset" | "ad",
  key: "campaign_id" | "adset_id" | "ad_id",
  rows: MetaInsightRow[],
  entityIds: Map<string, string>,
  insightRows: InsightUpsertRow[],
  campaignLevelRecords: InsightRecord[]
): void {
  for (const row of rows) {
    const platformId = row[key];
    if (!platformId) {
      continue;
    }
    const entityId = entityIds.get(platformId);
    if (entityId === undefined) {
      continue;
    }
    const record = normalizeInsight(row);
    if (level === "campaign") {
      campaignLevelRecords.push(record);
    }
    insightRows.push({ entityLevel: level, entityId, record });
  }
}

export async function backfillAccount(
  model: AdAccountsModel,
  account: AdAccount,
  rawMonths: number,
  hooks: SyncRunHooks = {}
): Promise<BackfillOutcome> {
  const months = clampBackfillMonths(rawMonths);
  if ((await hooks.shouldCancel?.()) === true) {
    throw new SyncCancelledError();
  }
  ensureNotRateLimited(account);

  const runner = createStageRunner(model, account, hooks);
  const summary: SyncSummary = createEmptySummary();

  const meta: AdPlatformAdapter | null = adapterOrNull(account);
  if (meta === null) {
    await runner.run("account_info", async () => {
      throw pendingTokenError();
    });
    return {
      ok: false,
      failedStage: "account_info",
      errorClass: runner.failedErrorClass ?? "invalid_token",
    };
  }

  const structure = await runStructureStages(
    model,
    account,
    meta,
    account.currency,
    runner,
    summary,
    hooks
  );
  if (!structure.ok) {
    return {
      ok: false,
      failedStage: runner.failedStage ?? "campaigns",
      errorClass: runner.failedErrorClass ?? "server_error",
    };
  }

  const windows = backfillChunkWindows(new Date().toISOString().slice(0, 10), months);
  const idsByLevel = {
    campaign: structure.campaignIdByPlatform,
    adset: structure.adSetIdByPlatform,
    ad: structure.adIdByPlatform,
  };

  let chunksDone = 0;
  try {
    for (const window of windows) {
      if ((await hooks.shouldCancel?.()) === true) {
        throw new SyncCancelledError();
      }
      await pullChunk(model, account, meta, account.currency, window, idsByLevel);
      chunksDone = window.chunk;
      await hooks.onStage?.({
        stage: "backfill",
        status: "succeeded",
        detail: {
          chunk: window.chunk,
          chunksTotal: window.chunksTotal,
          since: window.since,
          until: window.until,
        },
      });
    }
  } catch (error) {
    if (error instanceof SyncCancelledError) {
      throw error;
    }
    const metaError = toMetaError(error);
    return { ok: false, failedStage: "backfill", errorClass: metaError.errorClass };
  }

  return {
    ok: true,
    summary: {
      months,
      chunksTotal: windows.length,
      chunksDone,
      structure: { campaigns: summary.campaigns, adSets: summary.adSets, ads: summary.ads },
      removed: summary.removed,
      graphCalls: meta.graphCallCount(),
    },
  };
}
