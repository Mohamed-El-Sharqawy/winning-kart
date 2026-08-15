import type { AdAccount } from "@wk/db";
import { decrypt, encrypt } from "../../lib/crypto";
import { getMetaAdapter, MetaError } from "../../platforms/meta";
import type {
  AdPlatformAdapter,
  InsightLevel,
  InsightRecord,
  MetaAccountInfo,
} from "../../platforms/meta";
import {
  aggregateInsightsByDate,
  normalizeAccountInfo,
  normalizeAd,
  normalizeAdSet,
  normalizeCampaign,
  normalizeInsight,
  round2,
} from "../../platforms/meta";
import type {
  AdUpsertRow,
  AdSetUpsertRow,
  CampaignRow,
  CampaignWindowMetrics,
  InsightUpsertRow,
  SyncJobRow,
} from "./model";
import type { AdAccountsModel } from "./model";

export type SyncStage =
  | "account_info"
  | "campaigns"
  | "ad_sets"
  | "ads"
  | "insights"
  | "daily_series";

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
}

export type SyncOutcome =
  | { ok: true; stages: StageResult[]; summary: SyncSummary }
  | { ok: false; failedStage: SyncStage; errorClass: string; stages: StageResult[] };

export interface HttpServiceError {
  status: number;
  error: string;
}

export interface AdAccountView {
  id: string;
  name: string;
  slug: string;
  adAccountId: string;
  healthState: string;
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
}

export type CreateAdAccountResult =
  | { ok: true; account: AdAccountView }
  | { ok: false; error: HttpServiceError };

export type ReconnectResult =
  | { ok: true }
  | { ok: false; error: HttpServiceError };

export type RemoveResult =
  | { ok: true }
  | { ok: false; error: HttpServiceError };

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

export function utcWindow(days: number): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  return { since, until };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function toMetaError(error: unknown): MetaError {
  if (error instanceof MetaError) {
    return error;
  }
  const message = error instanceof Error ? error.message : "unexpected sync failure";
  return new MetaError("server_error", message);
}

export function mapMetaHttpError(error: MetaError): HttpServiceError {
  switch (error.errorClass) {
    case "invalid_token":
    case "permission_denied":
      return { status: 422, error: error.errorClass };
    case "rate_limited":
      return { status: 429, error: "rate_limited" };
    case "not_found":
      return { status: 422, error: "not_found" };
    default:
      return { status: 502, error: error.errorClass };
  }
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

  async detail(id: string): Promise<AdAccountDetailView | null> {
    const account = await this.model.findById(id);
    if (!account) {
      return null;
    }
    const recentJobs = await this.model.listRecentJobs(id, RECENT_JOBS_LIMIT);
    return {
      id: account.id,
      name: account.name,
      slug: account.slug,
      adAccountId: account.adAccountId,
      platform: account.platform,
      healthState: account.healthState,
      currency: account.currency,
      timezone: account.timezone,
      lastSyncAt: account.lastSyncAt,
      platformPayload: account.platformPayload ?? null,
      recentJobs,
    };
  }

  async create(clientId: string, input: CreateAdAccountInput): Promise<CreateAdAccountResult> {
    let info: MetaAccountInfo;
    try {
      info = await getMetaAdapter(input.accessToken).getAccountInfo(input.adAccountId);
    } catch (error) {
      return { ok: false, error: mapMetaHttpError(toMetaError(error)) };
    }
    const snapshot = normalizeAccountInfo(info);
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
          ...shared,
        });
        return { ok: true, account: toAccountView(account) };
      } catch (error) {
        if (isUniqueViolation(error) && attempt < 2) {
          attempt += 1;
          continue;
        }
        if (isUniqueViolation(error)) {
          return { ok: false, error: { status: 409, error: "slug already taken" } };
        }
        throw error;
      }
    }
  }

  async sync(id: string): Promise<SyncOutcome | null> {
    const account = await this.model.findById(id);
    if (!account) {
      return null;
    }

    const stages: StageResult[] = [];
    const summary: SyncSummary = { campaigns: 0, adSets: 0, ads: 0, insightDays: 0 };
    const campaignIdByPlatform = new Map<string, string>();
    const adSetIdByPlatform = new Map<string, string>();
    const adIdByPlatform = new Map<string, string>();
    let currency = account.currency;
    let platformPayload = isRecord(account.platformPayload)
      ? { ...account.platformPayload }
      : {};
    let failedStage: SyncStage | null = null;
    let failedErrorClass: string | null = null;

    const finalize = async (ok: boolean): Promise<SyncOutcome> => {
      await this.model.updateAdAccount(account.id, {
        healthState: ok ? "healthy" : "error",
        lastSyncAt: new Date(),
      });
      if (ok) {
        return { ok: true, stages, summary };
      }
      return {
        ok: false,
        failedStage: failedStage as SyncStage,
        errorClass: failedErrorClass as string,
        stages,
      };
    };

    const runStage = async (
      stage: SyncStage,
      run: () => Promise<unknown>
    ): Promise<boolean> => {
      const jobId = crypto.randomUUID();
      await this.model.insertSyncJob({
        id: jobId,
        adAccountId: account.id,
        stage,
        status: "running",
        startedAt: new Date(),
      });
      try {
        const detail = await run();
        await this.model.updateSyncJob(jobId, {
          status: "succeeded",
          detail: isRecord(detail) ? detail : null,
          endedAt: new Date(),
        });
        stages.push({ stage, status: "succeeded" });
        return true;
      } catch (error) {
        const metaError = toMetaError(error);
        failedStage = stage;
        failedErrorClass = metaError.errorClass;
        await this.model.updateSyncJob(jobId, {
          status: "failed",
          errorClass: metaError.errorClass,
          detail: { message: metaError.message },
          endedAt: new Date(),
        });
        stages.push({ stage, status: "failed", errorClass: metaError.errorClass });
        return false;
      }
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
      await runStage("account_info", async () => {
        throw new MetaError("invalid_token", "access token is pending oauth connection");
      });
      return finalize(false);
    }

    const meta = adapter;

    const accountInfoOk = await runStage("account_info", async () => {
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

    const campaignsOk = await runStage("campaigns", async () => {
      const rows = await meta.getCampaigns(account.adAccountId);
      const records = rows.map(normalizeCampaign);
      const upserted = await this.model.upsertCampaigns(account.id, currency, records);
      summary.campaigns = upserted.length;
      for (const row of upserted) {
        campaignIdByPlatform.set(row.platformCampaignId, row.id);
      }
      return { count: upserted.length };
    });
    if (!campaignsOk) {
      return finalize(false);
    }

    const adSetsOk = await runStage("ad_sets", async () => {
      const rows = await meta.getAdSets(account.adAccountId);
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
        });
      }
      const upserted = await this.model.upsertAdSets(insertRows);
      summary.adSets = upserted.length;
      for (const row of upserted) {
        adSetIdByPlatform.set(row.platformAdsetId, row.id);
      }
      return { count: upserted.length };
    });
    if (!adSetsOk) {
      return finalize(false);
    }

    const adsOk = await runStage("ads", async () => {
      const rows = await meta.getAds(account.adAccountId);
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
        });
      }
      const upserted = await this.model.upsertAds(insertRows);
      summary.ads = upserted.length;
      for (const row of upserted) {
        adIdByPlatform.set(row.platformAdId, row.id);
      }
      return { count: upserted.length };
    });
    if (!adsOk) {
      return finalize(false);
    }

    const insightsOk = await runStage("insights", async () => {
      const window = utcWindow(30);
      const insightRows: InsightUpsertRow[] = [];
      const campaignLevelRecords: InsightRecord[] = [];
      const levels: { level: InsightLevel; ids: Map<string, string>; key: "campaign_id" | "adset_id" | "ad_id" }[] = [
        { level: "campaign", ids: campaignIdByPlatform, key: "campaign_id" },
        { level: "adset", ids: adSetIdByPlatform, key: "adset_id" },
        { level: "ad", ids: adIdByPlatform, key: "ad_id" },
      ];
      for (const entry of levels) {
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

    const dailySeriesOk = await runStage("daily_series", async () => {
      const window = utcWindow(90);
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

  async reconnect(id: string, accessToken: string): Promise<ReconnectResult> {
    const account = await this.model.findById(id);
    if (!account) {
      return { ok: false, error: { status: 404, error: "not found" } };
    }
    try {
      await getMetaAdapter(accessToken).getAccountInfo(account.adAccountId);
    } catch (error) {
      return { ok: false, error: mapMetaHttpError(toMetaError(error)) };
    }
    await this.model.updateAdAccount(id, {
      accessTokenEncrypted: encrypt(accessToken),
      healthState: "healthy",
    });
    return { ok: true };
  }

  async remove(id: string, confirmSlug: string): Promise<RemoveResult> {
    const account = await this.model.findById(id);
    if (!account) {
      return { ok: false, error: { status: 404, error: "not found" } };
    }
    if (confirmSlug !== account.slug) {
      return { ok: false, error: { status: 422, error: "slug mismatch" } };
    }
    const deleted = await this.model.deleteAdAccount(id);
    if (!deleted) {
      return { ok: false, error: { status: 404, error: "not found" } };
    }
    return { ok: true };
  }

  async campaignsWithMetrics(id: string, days: number): Promise<CampaignWithMetrics[] | null> {
    const account = await this.model.findById(id);
    if (!account) {
      return null;
    }
    const window = utcWindow(Math.min(Math.max(days, 1), 90));
    const campaignRows = await this.model.listCampaignsByAccount(id);
    const metricsRows = await this.model.campaignMetricsSince(window.since);
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
