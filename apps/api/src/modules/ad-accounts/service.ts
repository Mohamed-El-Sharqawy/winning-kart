import type { AdAccount } from "@wk/db";
import { decrypt, encrypt } from "../../lib/crypto";
import { problem } from "../../lib/problem";
import type { ProblemError, ProblemErrorClass } from "../../lib/problem";
import { runDetectionForAccount } from "../../detection/engine";
import { getMetaAdapter, MetaError } from "../../platforms/meta";
import { storedRateLimitBlocked } from "../../platforms/meta/rate-limit";
import type {
  AdPlatformAdapter,
  InsightLevel,
  InsightRecord,
  MetaAccountInfo,
} from "../../platforms/meta";
import {
  aggregateInsightsByDate,
  normalizeAccountInfo,
  normalizeInsight,
  round2,
} from "../../platforms/meta";
import type {
  CampaignRow,
  CampaignWindowMetrics,
  InsightUpsertRow,
  SyncJobRow,
} from "./model";
import type { AdAccountsModel } from "./model";
import { backfillAccount } from "./backfill";
import type { BackfillOutcome } from "./backfill";
import { createStageRunner, runStructureStages } from "./stages";
import { isRecord, SyncCancelledError } from "./stages";
import type { SyncStage, StageResult, SyncSummary, SyncRunHooks } from "./stages";

export { SyncCancelledError } from "./stages";
export type { SyncStage, StageResult, SyncSummary, SyncRunHooks } from "./stages";

export type TokenType = "system_user" | "user_60d";

export type SyncOutcome =
  | { ok: true; stages: StageResult[]; summary: SyncSummary }
  | { ok: false; failedStage: SyncStage; errorClass: string; stages: StageResult[] };

export interface AdAccountView {
  id: string;
  name: string;
  slug: string;
  adAccountId: string;
  healthState: string;
  tokenType: TokenType;
  tokenExpiresAt: Date | null;
  currency: string;
  timezone: string;
}

export interface AdAccountDetailView extends AdAccountView {
  platform: string;
  lastSyncAt: Date | null;
  platformPayload: unknown;
  recentJobs: SyncJobRow[];
}

export interface CreateAdAccountInput {
  name: string;
  adAccountId: string;
  accessToken: string;
  tokenType?: TokenType;
}

export interface CampaignWithMetrics {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  buyingType: string | null;
  currency: string;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  scheduleStart: Date | null;
  scheduleEnd: Date | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

const RECENT_JOBS_LIMIT = 12;
const DAY_MS = 86400000;
const USER_TOKEN_TTL_DAYS = 60;
const TOKEN_WARNING_DAYS = 7;
const INSIGHT_DELTA_DAYS = 3;
const SYNC_WINDOW_DAYS = clampEnvInt("WK_SYNC_WINDOW_DAYS", 30, 1, 90);

function clampEnvInt(key: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(value, min), max);
}

export function utcWindow(days: number): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  return { since, until };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23503"
  );
}

function metaProblem(error: MetaError): ProblemError {
  switch (error.errorClass) {
    case "invalid_token":
      return problem(422, "INVALID_TOKEN", error.message, "invalid_token");
    case "permission_denied":
      return problem(422, "PERMISSION_DENIED", error.message, "permission_denied");
    case "rate_limited":
      return problem(429, "RATE_LIMITED", error.message, "rate_limited");
    case "not_found":
      return problem(422, "ACCOUNT_NOT_FOUND", error.message, "not_found");
    default:
      return problem(502, "UPSTREAM_ERROR", error.message, error.errorClass as ProblemErrorClass);
  }
}

function toProblemError(error: unknown): ProblemError {
  const metaError =
    error instanceof MetaError
      ? error
      : new MetaError(
          "server_error",
          error instanceof Error ? error.message : "unexpected sync failure"
        );
  return metaProblem(metaError);
}

function accountNotFound(id: string): ProblemError {
  return problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${id}`);
}

function tokenExpiry(tokenType: TokenType): Date | null {
  if (tokenType !== "user_60d") {
    return null;
  }
  return new Date(Date.now() + USER_TOKEN_TTL_DAYS * DAY_MS);
}

function tokenWarningActive(account: AdAccount): boolean {
  if (account.tokenType !== "user_60d" || account.tokenExpiresAt === null) {
    return false;
  }
  const remaining = account.tokenExpiresAt.getTime() - Date.now();
  return remaining > 0 && remaining <= TOKEN_WARNING_DAYS * DAY_MS;
}

function successHealthState(account: AdAccount): "healthy" | "warning" {
  return tokenWarningActive(account) ? "warning" : "healthy";
}

function buildSlug(name: string): string {
  const kebab = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const base = kebab.length > 0 ? kebab : "ad-account";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function toAccountView(account: AdAccount): AdAccountView {
  return {
    id: account.id,
    name: account.name,
    slug: account.slug,
    adAccountId: account.adAccountId,
    healthState: account.healthState,
    tokenType: account.tokenType,
    tokenExpiresAt: account.tokenExpiresAt,
    currency: account.currency,
    timezone: account.timezone,
  };
}

function toCampaignWithMetrics(
  row: CampaignRow,
  metrics: CampaignWindowMetrics | null
): CampaignWithMetrics {
  const spend = metrics === null ? null : round2(metrics.spend);
  const revenue = metrics === null ? null : round2(metrics.revenue);
  const purchases = metrics === null ? null : metrics.purchases;
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    objective: row.objective,
    buyingType: row.buyingType,
    currency: row.currency,
    dailyBudget: row.dailyBudget,
    lifetimeBudget: row.lifetimeBudget,
    scheduleStart: row.scheduleStart,
    scheduleEnd: row.scheduleEnd,
    spend,
    revenue,
    purchases,
    roas: metrics !== null && spend !== null && spend > 0 && revenue !== null
      ? round2(revenue / spend)
      : null,
    cpa: metrics !== null && purchases !== null && purchases > 0 && spend !== null
      ? round2(spend / purchases)
      : null,
    ctr:
      metrics !== null && metrics.impressions > 0
        ? round2((metrics.clicks / metrics.impressions) * 100)
        : null,
    frequency:
      metrics !== null && metrics.reach > 0
        ? round2(metrics.impressions / metrics.reach)
        : null,
  };
}

export class AdAccountsService {
  constructor(private readonly model: AdAccountsModel) {}

  listForClient(clientId: string) {
    return this.model.listByClient(clientId);
  }

  async rateLimit(id: string): Promise<unknown> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    if (account.platformPayload === null || !isRecord(account.platformPayload)) {
      return null;
    }
    return account.platformPayload.rateLimit ?? null;
  }

  async detail(id: string): Promise<AdAccountDetailView> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    const recentJobs = await this.model.listRecentJobs(id, RECENT_JOBS_LIMIT);
    return {
      id: account.id,
      name: account.name,
      slug: account.slug,
      adAccountId: account.adAccountId,
      platform: account.platform,
      healthState: account.healthState,
      tokenType: account.tokenType,
      tokenExpiresAt: account.tokenExpiresAt,
      currency: account.currency,
      timezone: account.timezone,
      lastSyncAt: account.lastSyncAt,
      platformPayload: account.platformPayload ?? null,
      recentJobs,
    };
  }

  async create(clientId: string, input: CreateAdAccountInput): Promise<AdAccountView> {
    let info: MetaAccountInfo;
    try {
      info = await getMetaAdapter(input.accessToken).getAccountInfo(input.adAccountId);
    } catch (error) {
      throw toProblemError(error);
    }
    const snapshot = normalizeAccountInfo(info);
    const tokenType = input.tokenType ?? "system_user";
    const shared = {
      platformPayload: {
        businessId: null,
        pageId: null,
        pixelId: null,
        accountStatusRaw: snapshot.accountStatusRaw,
        amountSpent: snapshot.amountSpent,
        spendCap: snapshot.spendCap,
        balance: snapshot.balance,
      },
      accessTokenEncrypted: encrypt(input.accessToken),
      currency: snapshot.currency ?? "AED",
      timezone: snapshot.timezone ?? "Asia/Dubai",
    };
    let attempt = 0;
    for (;;) {
      try {
        const account = await this.model.insertAdAccount({
          id: crypto.randomUUID(),
          clientId,
          name: input.name,
          slug: buildSlug(input.name),
          adAccountId: input.adAccountId,
          platform: "meta",
          healthState: "healthy",
          tokenType,
          tokenExpiresAt: tokenExpiry(tokenType),
          ...shared,
        });
        return toAccountView(account);
      } catch (error) {
        if (isUniqueViolation(error) && attempt < 2) {
          attempt += 1;
          continue;
        }
        if (isUniqueViolation(error)) {
          throw problem(409, "SLUG_TAKEN", "An ad account with this slug already exists");
        }
        if (isForeignKeyViolation(error)) {
          throw problem(404, "RESOURCE_NOT_FOUND", `No client with id ${clientId}`);
        }
        throw error;
      }
    }
  }

  async sync(id: string, hooks: SyncRunHooks = {}): Promise<SyncOutcome> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    if ((await hooks.shouldCancel?.()) === true) {
      throw new SyncCancelledError();
    }

    const runner = createStageRunner(this.model, account, hooks);
    const summary: SyncSummary = { campaigns: 0, adSets: 0, ads: 0, insightDays: 0, graphCalls: 0 };
    let currency = account.currency;
    let platformPayload = isRecord(account.platformPayload)
      ? { ...account.platformPayload }
      : {};
    let meta: AdPlatformAdapter | null = null;

    const storedBlock = storedRateLimitBlocked(account.platformPayload);
    if (storedBlock.blocked) {
      const estimate = storedBlock.estClearMin !== null ? ` ~${storedBlock.estClearMin} min` : "";
      throw problem(
        429,
        "RATE_LIMITED",
        `Meta rate limit active; do not retry until the window clears.${estimate}`,
        "rate_limited"
      );
    }

    const finalize = async (ok: boolean): Promise<SyncOutcome> => {
      summary.graphCalls = meta !== null ? meta.graphCallCount() : 0;
      if (meta !== null) {
        platformPayload = { ...platformPayload, rateLimit: meta.rateGuard.snapshot() };
      }
      await this.model.updateAdAccount(account.id, {
        healthState: ok ? successHealthState(account) : "error",
        lastSyncAt: new Date(),
        platformPayload,
      });
      if (ok) {
        try {
          await runDetectionForAccount(account.id);
        } catch {
        }
      }
      if (ok) {
        return { ok: true, stages: runner.stages, summary };
      }
      return {
        ok: false,
        failedStage: runner.failedStage as SyncStage,
        errorClass: runner.failedErrorClass as string,
        stages: runner.stages,
      };
    };

    let adapter: AdPlatformAdapter | null = null;
    if (!account.accessTokenEncrypted.startsWith("pending-oauth")) {
      try {
        adapter = getMetaAdapter(decrypt(account.accessTokenEncrypted));
      } catch {
        adapter = null;
      }
    }

    if (adapter === null) {
      await runner.run("account_info", async () => {
        throw new MetaError("invalid_token", "access token is pending oauth connection");
      });
      return finalize(false);
    }

    meta = adapter;

    const accountInfoOk = await runner.run("account_info", async () => {
      const info = await meta.getAccountInfo(account.adAccountId);
      const snapshot = normalizeAccountInfo(info);
      currency = snapshot.currency ?? currency;
      platformPayload = {
        ...platformPayload,
        businessId: null,
        pageId: null,
        pixelId: null,
        accountStatusRaw: snapshot.accountStatusRaw,
        amountSpent: snapshot.amountSpent,
        spendCap: snapshot.spendCap,
        balance: snapshot.balance,
      };
      await this.model.updateAdAccount(account.id, {
        platformPayload,
        currency,
        timezone: snapshot.timezone ?? account.timezone,
      });
      return null;
    });
    if (!accountInfoOk) {
      return finalize(false);
    }

    const structure = await runStructureStages(
      this.model,
      account,
      meta,
      currency,
      runner,
      summary,
      hooks
    );
    if (!structure.ok) {
      return finalize(false);
    }
    const { campaignIdByPlatform, adSetIdByPlatform, adIdByPlatform } = structure;

    const insightsOk = await runner.run("insights", async () => {
      const insightRows: InsightUpsertRow[] = [];
      const campaignLevelRecords: InsightRecord[] = [];
      const levels: { level: InsightLevel; ids: Map<string, string>; key: "campaign_id" | "adset_id" | "ad_id" }[] = [
        { level: "campaign", ids: campaignIdByPlatform, key: "campaign_id" },
        { level: "adset", ids: adSetIdByPlatform, key: "adset_id" },
        { level: "ad", ids: adIdByPlatform, key: "ad_id" },
      ];
      for (const entry of levels) {
        const hasStored = await this.model.hasInsightRows(account.id, entry.level);
        const window = hasStored
          ? utcWindow(INSIGHT_DELTA_DAYS)
          : utcWindow(SYNC_WINDOW_DAYS);
        const rows = await meta.getInsights(account.adAccountId, entry.level, window);
        for (const row of rows) {
          const platformId = row[entry.key];
          if (!platformId) {
            continue;
          }
          const entityId = entry.ids.get(platformId);
          if (entityId === undefined) {
            continue;
          }
          const record = normalizeInsight(row);
          if (entry.level === "campaign") {
            campaignLevelRecords.push(record);
          }
          insightRows.push({ entityLevel: entry.level, entityId, record });
        }
      }
      const accountDaily = aggregateInsightsByDate(campaignLevelRecords);
      for (const record of accountDaily.values()) {
        insightRows.push({ entityLevel: "account", entityId: account.id, record });
      }
      await this.model.upsertInsights(account.id, currency, insightRows);
      summary.insightDays = accountDaily.size;
      return { rows: insightRows.length, days: accountDaily.size };
    });
    if (!insightsOk) {
      return finalize(false);
    }

    const dailySeriesOk = await runner.run("daily_series", async () => {
      const hasStored = await this.model.hasInsightRows(account.id, "account");
      const window = hasStored ? utcWindow(INSIGHT_DELTA_DAYS) : utcWindow(SYNC_WINDOW_DAYS);
      const rows = await meta.getInsights(account.adAccountId, "account", window);
      const insightRows: InsightUpsertRow[] = rows.map((row) => ({
        entityLevel: "account" as const,
        entityId: account.id,
        record: normalizeInsight(row),
      }));
      await this.model.upsertInsights(account.id, currency, insightRows);
      return { rows: insightRows.length };
    });
    if (!dailySeriesOk) {
      return finalize(false);
    }

    return finalize(true);
  }

  async backfill(id: string, months: number, hooks: SyncRunHooks = {}): Promise<BackfillOutcome> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    return backfillAccount(this.model, account, months, hooks);
  }

  async reconnect(id: string, accessToken: string, tokenType?: TokenType): Promise<void> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    try {
      await getMetaAdapter(accessToken).getAccountInfo(account.adAccountId);
    } catch (error) {
      throw toProblemError(error);
    }
    const resolvedTokenType = tokenType ?? "system_user";
    await this.model.updateAdAccount(id, {
      accessTokenEncrypted: encrypt(accessToken),
      healthState: "healthy",
      tokenType: resolvedTokenType,
      tokenExpiresAt: tokenExpiry(resolvedTokenType),
    });
  }

  async remove(id: string, confirmSlug: string): Promise<void> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    if (confirmSlug !== account.slug) {
      throw problem(422, "SLUG_MISMATCH", "confirmSlug does not match the ad account slug");
    }
    const deleted = await this.model.deleteAdAccount(id);
    if (!deleted) {
      throw accountNotFound(id);
    }
  }

  async campaignsWithMetrics(
    id: string,
    window: { since: string; until: string }
  ): Promise<CampaignWithMetrics[]> {
    const account = await this.model.findById(id);
    if (!account) {
      throw accountNotFound(id);
    }
    const campaignRows = await this.model.listCampaignsByAccount(id);
    const metricsRows = await this.model.campaignMetricsWindow(window.since, window.until);
    const metricsByEntity = new Map(metricsRows.map((row) => [row.entityId, row]));
    if (metricsByEntity.size === 0) {
      return campaignRows.map((row) => toCampaignWithMetrics(row, null));
    }
    const views: CampaignWithMetrics[] = [];
    for (const row of campaignRows) {
      const metrics = metricsByEntity.get(row.id);
      if (metrics === undefined) {
        continue;
      }
      views.push(toCampaignWithMetrics(row, metrics));
    }
    views.sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
    return views;
  }
}
