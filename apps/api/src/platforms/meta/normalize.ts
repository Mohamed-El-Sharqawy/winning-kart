import { ENTITY_STATUSES } from "@wk/db";
import type { AdFormat, EntityStatus } from "@wk/db";
import type {
  MetaAccountInfo,
  MetaActionMetric,
  MetaAdRow,
  MetaAdSetRow,
  MetaCampaignRow,
  MetaInsightRow,
} from "./client";

export { ENTITY_STATUSES } from "@wk/db";
export type { AdFormat, EntityStatus } from "@wk/db";

export interface CampaignRecord {
  platformCampaignId: string;
  name: string;
  status: EntityStatus;
  objective: string | null;
  buyingType: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  scheduleStart: Date | null;
  scheduleEnd: Date | null;
  platformUpdatedAt: Date | null;
}

export interface AdSetRecord {
  platformAdsetId: string;
  campaignPlatformId: string;
  name: string;
  status: EntityStatus;
  optimizationGoal: string | null;
  bidStrategy: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  platformUpdatedAt: Date | null;
}

export interface AdRecord {
  platformAdId: string;
  adSetPlatformId: string;
  name: string;
  status: EntityStatus;
  format: AdFormat | null;
  creativeId: string | null;
  platformUpdatedAt: Date | null;
}

export interface InsightRecord {
  date: string;
  spend: number;
  revenue: number;
  purchases: number;
  addToCart: number;
  initiateCheckout: number;
  landingPageViews: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
}

export interface AccountInfoSnapshot {
  currency: string | null;
  timezone: string | null;
  accountStatusRaw: number | null;
  amountSpent: number | null;
  spendCap: number | null;
  balance: number | null;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toMoneyFromCents(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return round2(parsed / 100).toFixed(2);
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMetaTime(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parsePlatformTime(value: string | undefined): Date | null {
  return parseMetaTime(value);
}

export function mapEntityStatus(
  effectiveStatus: string | undefined,
  rawStatus?: string | undefined
): EntityStatus {
  const value = effectiveStatus ?? rawStatus;
  if (value === "ADD_REPORTS_RUNNING") {
    return "ACTIVE";
  }
  if (value !== undefined && (ENTITY_STATUSES as readonly string[]).includes(value)) {
    return value as EntityStatus;
  }
  return "UNKNOWN";
}

function isPurchaseType(actionType: string): boolean {
  return actionType === "purchase";
}

function isAddToCartType(actionType: string): boolean {
  return actionType === "add_to_cart";
}

function isInitiateCheckoutType(actionType: string): boolean {
  return actionType === "initiate_checkout";
}

function isLandingPageViewType(actionType: string): boolean {
  return actionType === "landing_page_view";
}

function sumActionTypes(
  metrics: MetaActionMetric[] | undefined,
  matches: (actionType: string) => boolean
): number {
  if (!Array.isArray(metrics)) {
    return 0;
  }
  let total = 0;
  for (const metric of metrics) {
    if (typeof metric?.action_type === "string" && matches(metric.action_type)) {
      total += toNumber(metric.value);
    }
  }
  return total;
}

function sumPurchaseMetrics(metrics: MetaActionMetric[] | undefined): number {
  return sumActionTypes(metrics, isPurchaseType);
}

export function normalizeAccountInfo(info: MetaAccountInfo): AccountInfoSnapshot {
  return {
    currency: info.currency && info.currency.length > 0 ? info.currency : null,
    timezone: info.timezone_name && info.timezone_name.length > 0 ? info.timezone_name : null,
    accountStatusRaw: typeof info.account_status === "number" ? info.account_status : null,
    amountSpent: toOptionalNumber(info.amount_spent ?? null),
    spendCap: toOptionalNumber(info.spend_cap ?? null),
    balance: toOptionalNumber(info.balance ?? null),
  };
}

export function normalizeCampaign(row: MetaCampaignRow): CampaignRecord {
  return {
    platformCampaignId: row.id,
    name: row.name,
    status: mapEntityStatus(row.effective_status, row.status),
    objective: row.objective ?? null,
    buyingType: row.buying_type ?? null,
    dailyBudget: toMoneyFromCents(row.daily_budget),
    lifetimeBudget: toMoneyFromCents(row.lifetime_budget),
    scheduleStart: parseMetaTime(row.start_time),
    scheduleEnd: parseMetaTime(row.stop_time),
    platformUpdatedAt: parseMetaTime(row.updated_time),
  };
}

export function normalizeAdSet(row: MetaAdSetRow): AdSetRecord {
  return {
    platformAdsetId: row.id,
    campaignPlatformId: row.campaign_id,
    name: row.name,
    status: mapEntityStatus(row.effective_status, row.status),
    optimizationGoal: row.optimization_goal ?? null,
    bidStrategy: row.bid_strategy ?? null,
    dailyBudget: toMoneyFromCents(row.daily_budget),
    lifetimeBudget: toMoneyFromCents(row.lifetime_budget),
    platformUpdatedAt: parseMetaTime(row.updated_time),
  };
}

export function normalizeAd(row: MetaAdRow): AdRecord {
  return {
    platformAdId: row.id,
    adSetPlatformId: row.adset_id,
    name: row.name,
    status: mapEntityStatus(row.effective_status, row.status),
    format: null,
    creativeId: row.creative?.id ?? null,
    platformUpdatedAt: parseMetaTime(row.updated_time),
  };
}

export function normalizeInsight(row: MetaInsightRow): InsightRecord {
  return {
    date: row.date_start,
    spend: round2(toNumber(row.spend)),
    revenue: round2(sumPurchaseMetrics(row.action_values)),
    purchases: Math.round(sumPurchaseMetrics(row.actions)),
    addToCart: Math.round(sumActionTypes(row.actions, isAddToCartType)),
    initiateCheckout: Math.round(sumActionTypes(row.actions, isInitiateCheckoutType)),
    landingPageViews: Math.round(sumActionTypes(row.actions, isLandingPageViewType)),
    impressions: Math.round(toNumber(row.impressions)),
    reach: Math.round(toNumber(row.reach)),
    clicks: Math.round(toNumber(row.clicks)),
    ctr: round2(toNumber(row.ctr)),
    cpc: round2(toNumber(row.cpc)),
    cpm: round2(toNumber(row.cpm)),
    frequency: round2(toNumber(row.frequency)),
  };
}

export function aggregateInsightsByDate(rows: InsightRecord[]): Map<string, InsightRecord> {
  const totalsByDate = new Map<
    string,
    {
      spend: number;
      revenue: number;
      purchases: number;
      addToCart: number;
      initiateCheckout: number;
      landingPageViews: number;
      impressions: number;
      reach: number;
      clicks: number;
    }
  >();
  for (const row of rows) {
    const totals =
      totalsByDate.get(row.date) ??
      {
        spend: 0,
        revenue: 0,
        purchases: 0,
        addToCart: 0,
        initiateCheckout: 0,
        landingPageViews: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
      };
    totals.spend += row.spend;
    totals.revenue += row.revenue;
    totals.purchases += row.purchases;
    totals.addToCart += row.addToCart;
    totals.initiateCheckout += row.initiateCheckout;
    totals.landingPageViews += row.landingPageViews;
    totals.impressions += row.impressions;
    totals.reach += row.reach;
    totals.clicks += row.clicks;
    totalsByDate.set(row.date, totals);
  }
  const result = new Map<string, InsightRecord>();
  for (const [date, totals] of totalsByDate) {
    result.set(date, {
      date,
      spend: round2(totals.spend),
      revenue: round2(totals.revenue),
      purchases: Math.round(totals.purchases),
      addToCart: Math.round(totals.addToCart),
      initiateCheckout: Math.round(totals.initiateCheckout),
      landingPageViews: Math.round(totals.landingPageViews),
      impressions: Math.round(totals.impressions),
      reach: Math.round(totals.reach),
      clicks: Math.round(totals.clicks),
      ctr: totals.impressions > 0 ? round2((totals.clicks / totals.impressions) * 100) : 0,
      cpc: totals.clicks > 0 ? round2(totals.spend / totals.clicks) : 0,
      cpm: totals.impressions > 0 ? round2((totals.spend / totals.impressions) * 1000) : 0,
      frequency: totals.reach > 0 ? round2(totals.impressions / totals.reach) : 0,
    });
  }
  return result;
}
