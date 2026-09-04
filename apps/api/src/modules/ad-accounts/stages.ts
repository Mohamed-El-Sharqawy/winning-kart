import type { AdAccount } from "@wk/db";
import { MetaError } from "../../platforms/meta";
import type { AdPlatformAdapter } from "../../platforms/meta";
import {
  AD_FIELDS,
  AD_SET_FIELDS,
  CAMPAIGN_FIELDS,
  mapEntityStatus,
  normalizeAd,
  normalizeAdSet,
  normalizeCampaign,
  parsePlatformTime,
} from "../../platforms/meta";
import type {
  MetaAdRow,
  MetaAdSetRow,
  MetaCampaignRow,
} from "../../platforms/meta";
import type {
  AdUpsertRow,
  AdSetUpsertRow,
  EntityStatusPatch,
  PlatformEntityState,
} from "./model";
import type { AdAccountsModel } from "./model";

export type JobStage =
  | "account_info"
  | "campaigns"
  | "ad_sets"
  | "ads"
  | "insights"
  | "daily_series";

export type SyncStage = JobStage | "backfill";

export interface StageResult {
  stage: SyncStage;
  status: "succeeded" | "failed";
  errorClass?: string;
}

export interface SyncSummary {
  campaigns: number;
  adSets: number;
  ads: number;
  insightDays: number;
  graphCalls: number;
}

export class SyncCancelledError extends Error {
  constructor() {
    super("sync cancelled");
    this.name = "SyncCancelledError";
  }
}

export interface SyncRunHooks {
  onStage?: (info: {
    stage: SyncStage;
    status: "succeeded" | "failed";
    detail: unknown;
  }) => Promise<void> | void;
  shouldCancel?: () => boolean | Promise<boolean>;
}

export interface StageRunner {
  readonly stages: StageResult[];
  failedStage: SyncStage | null;
  failedErrorClass: string | null;
  run(stage: JobStage, fn: () => Promise<unknown>): Promise<boolean>;
}

const DELTA_PER_ENTITY_MAX_DEFAULT = 25;

function envInt(key: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function deltaPerEntityMax(): number {
  const parsed = Number.parseInt(process.env.WK_DELTA_PER_ENTITY_MAX ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DELTA_PER_ENTITY_MAX_DEFAULT;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toMetaError(error: unknown): MetaError {
  if (error instanceof MetaError) {
    return error;
  }
  const message = error instanceof Error ? error.message : "unexpected sync failure";
  return new MetaError("server_error", message);
}

function needsRefetch(
  stored: PlatformEntityState | undefined,
  lightUpdatedTime: string | undefined
): boolean {
  if (stored === undefined) {
    return true;
  }
  const parsed = parsePlatformTime(lightUpdatedTime);
  if (parsed === null) {
    return false;
  }
  return stored.platformUpdatedAt === null || stored.platformUpdatedAt.getTime() !== parsed.getTime();
}

function idsToRefetch<T extends { id: string; updated_time?: string }>(
  lightRows: T[],
  stored: Map<string, PlatformEntityState>
): string[] {
  return lightRows
    .filter((row) => needsRefetch(stored.get(row.id), row.updated_time))
    .map((row) => row.id);
}

function toStatusPatches(rows: { id: string; effective_status?: string }[]): EntityStatusPatch[] {
  return rows
    .filter((row) => row.effective_status !== undefined)
    .map((row) => ({ platformId: row.id, status: mapEntityStatus(row.effective_status) }));
}

async function fullRowsOrEdgeFallback<T>(
  meta: AdPlatformAdapter,
  ids: string[],
  fields: string,
  entityLabel: string,
  edgeFetch: () => Promise<T[]>
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }
  if (ids.length > deltaPerEntityMax()) {
    return edgeFetch();
  }
  const rows: T[] = [];
  for (const id of ids) {
    const row = await meta.getEntityById<T>(id, fields);
    if (row !== null) {
      rows.push(row);
    }
  }
  if (rows.length < ids.length) {
    console.warn(`${entityLabel}: ${ids.length - rows.length} of ${ids.length} entity fetches skipped`);
  }
  return rows;
}

export function createStageRunner(
  model: AdAccountsModel,
  account: { id: string },
  hooks: SyncRunHooks
): StageRunner {
  const runner: StageRunner = {
    stages: [],
    failedStage: null,
    failedErrorClass: null,
    async run(stage, fn) {
      if ((await hooks.shouldCancel?.()) === true) {
        throw new SyncCancelledError();
      }
      const jobId = crypto.randomUUID();
      await model.insertSyncJob({
        id: jobId,
        adAccountId: account.id,
        stage,
        status: "running",
        startedAt: new Date(),
      });
      try {
        const detail = await fn();
        await model.updateSyncJob(jobId, {
          status: "succeeded",
          detail: isRecord(detail) ? detail : null,
          endedAt: new Date(),
        });
        runner.stages.push({ stage, status: "succeeded" });
        await hooks.onStage?.({ stage, status: "succeeded", detail: detail ?? null });
        return true;
      } catch (error) {
        if (error instanceof SyncCancelledError) {
          throw error;
        }
        const metaError = toMetaError(error);
        runner.failedStage = stage;
        runner.failedErrorClass = metaError.errorClass;
        await model.updateSyncJob(jobId, {
          status: "failed",
          errorClass: metaError.errorClass,
          detail: { message: metaError.message },
          endedAt: new Date(),
        });
        runner.stages.push({ stage, status: "failed", errorClass: metaError.errorClass });
        await hooks.onStage?.({
          stage,
          status: "failed",
          detail: { errorClass: metaError.errorClass, message: metaError.message },
        });
        return false;
      }
    },
  };
  return runner;
}

export interface StructureStageOutput {
  ok: boolean;
  campaignIdByPlatform: Map<string, string>;
  adSetIdByPlatform: Map<string, string>;
  adIdByPlatform: Map<string, string>;
}

export async function runStructureStages(
  model: AdAccountsModel,
  account: AdAccount,
  meta: AdPlatformAdapter,
  currency: string,
  runner: StageRunner,
  summary: SyncSummary,
  hooks: SyncRunHooks
): Promise<StructureStageOutput> {
  const campaignIdByPlatform = new Map<string, string>();
  const adSetIdByPlatform = new Map<string, string>();
  const adIdByPlatform = new Map<string, string>();

  const campaignsOk = await runner.run("campaigns", async () => {
    const lightRows = await meta.getCampaignIds(account.adAccountId);
    await model.updateCampaignStatuses(account.id, toStatusPatches(lightRows));
    const states = await model.campaignStates(account.id);
    for (const [platformId, state] of states) {
      campaignIdByPlatform.set(platformId, state.id);
    }
    const changedIds = idsToRefetch(lightRows, states);
    const rows = await fullRowsOrEdgeFallback<MetaCampaignRow>(
      meta,
      changedIds,
      CAMPAIGN_FIELDS,
      "campaigns",
      () => meta.getCampaigns(account.adAccountId)
    );
    const records = rows.map(normalizeCampaign);
    const upserted = await model.upsertCampaigns(account.id, currency, records);
    summary.campaigns = upserted.length;
    for (const row of upserted) {
      campaignIdByPlatform.set(row.platformCampaignId, row.id);
    }
    return { total: lightRows.length, changed: changedIds.length, upserted: upserted.length };
  });
  if (!campaignsOk) {
    return { ok: false, campaignIdByPlatform, adSetIdByPlatform, adIdByPlatform };
  }

  const adSetsOk = await runner.run("ad_sets", async () => {
    const lightRows = await meta.getAdSetIds(account.adAccountId);
    await model.updateAdSetStatuses(account.id, toStatusPatches(lightRows));
    const states = await model.adSetStates(account.id);
    for (const [platformId, state] of states) {
      adSetIdByPlatform.set(platformId, state.id);
    }
    const changedIds = idsToRefetch(lightRows, states);
    const rows = await fullRowsOrEdgeFallback<MetaAdSetRow>(
      meta,
      changedIds,
      AD_SET_FIELDS,
      "ad sets",
      () => meta.getAdSets(account.adAccountId)
    );
    const insertRows: AdSetUpsertRow[] = [];
    for (const row of rows) {
      const record = normalizeAdSet(row);
      const campaignId = campaignIdByPlatform.get(record.campaignPlatformId);
      if (campaignId === undefined) {
        continue;
      }
      insertRows.push({
        campaignId,
        platformAdsetId: record.platformAdsetId,
        name: record.name,
        status: record.status,
        optimizationGoal: record.optimizationGoal,
        bidStrategy: record.bidStrategy,
        dailyBudget: record.dailyBudget,
        lifetimeBudget: record.lifetimeBudget,
        platformUpdatedAt: record.platformUpdatedAt,
      });
    }
    const upserted = await model.upsertAdSets(insertRows);
    summary.adSets = upserted.length;
    for (const row of upserted) {
      adSetIdByPlatform.set(row.platformAdsetId, row.id);
    }
    return { total: lightRows.length, changed: changedIds.length, upserted: upserted.length };
  });
  if (!adSetsOk) {
    return { ok: false, campaignIdByPlatform, adSetIdByPlatform, adIdByPlatform };
  }

  const adsOk = await runner.run("ads", async () => {
    const lightRows = await meta.getAdIds(account.adAccountId);
    await model.updateAdStatuses(account.id, toStatusPatches(lightRows));
    const states = await model.adStates(account.id);
    for (const [platformId, state] of states) {
      adIdByPlatform.set(platformId, state.id);
    }
    const changedIds = idsToRefetch(lightRows, states);
    const rows = await fullRowsOrEdgeFallback<MetaAdRow>(
      meta,
      changedIds,
      AD_FIELDS,
      "ads",
      () => meta.getAds(account.adAccountId)
    );
    const insertRows: AdUpsertRow[] = [];
    for (const row of rows) {
      const record = normalizeAd(row);
      const adSetId = adSetIdByPlatform.get(record.adSetPlatformId);
      if (adSetId === undefined) {
        continue;
      }
      insertRows.push({
        adSetId,
        platformAdId: record.platformAdId,
        name: record.name,
        status: record.status,
        format: record.format,
        creativeId: record.creativeId,
        platformUpdatedAt: record.platformUpdatedAt,
      });
    }
    const upserted = await model.upsertAds(insertRows);
    summary.ads = upserted.length;
    for (const row of upserted) {
      adIdByPlatform.set(row.platformAdId, row.id);
    }
    return {
      total: lightRows.length,
      changed: changedIds.length,
      upserted: upserted.length,
    };
  });

  return {
    ok: adsOk,
    campaignIdByPlatform,
    adSetIdByPlatform,
    adIdByPlatform,
  };
}
