import { problem } from "../../lib/problem";
import { resolveWindow, shiftDate } from "../../lib/window";
import type { ResolvedWindow, WindowQuery } from "../../lib/window";
import { round2 } from "../../platforms/meta";
import { classifyAdsRow } from "./ads-decoration";
import type { AdsRow } from "./ads-decoration";
import { deriveAdMetrics, deriveWindowMetrics } from "./ads-metrics";
import { trendWindows } from "./ads-list";
import { STATUS_GROUPS } from "./ads-query";
import type { AdsPageInput } from "./ads-repository";
import { toAdSetItem } from "./ad-set-items";
import { LIST_PAGE_MAX } from "./list-query";
import type { PagedListInput } from "./list-repository";
import type { CampaignDetailDeps } from "./campaign-detail-types";
import type {
  AdPerformance,
  CampaignDetailPayload,
  CampaignFunnel,
  CampaignPerformance,
  CampaignPrev,
  SeriesPoint,
} from "./campaign-detail-types";
import type { CampaignDailyRow, WindowSums } from "./model";

const EMBEDDED_ADS_LIMIT = 10;

function toAdPerformance(row: AdsRow): AdPerformance {
  const metrics = deriveAdMetrics(row.sums);
  return {
    id: row.id,
    adSetId: row.adSetId,
    adSetName: row.adSetName,
    campaignName: row.campaignName,
    platformAdId: row.platformAdId,
    name: row.name,
    status: row.status,
    format: row.format,
    creativeId: row.creativeId,
    thumbnailUrl: row.thumbnailUrl,
    bodyCopy: row.bodyCopy,
    spend: metrics?.spend ?? null,
    revenue: metrics?.revenue ?? null,
    purchases: metrics?.purchases ?? null,
    roas: metrics?.roas ?? null,
    cpa: metrics?.cpa ?? null,
    ctr: metrics?.ctr ?? null,
    frequency: metrics?.frequency ?? null,
    spendShare: row.spendShare === null ? null : round2(row.spendShare),
    fatigue: classifyAdsRow(row, metrics),
  };
}

function buildSeries(since: string, until: string, rows: CampaignDailyRow[]): SeriesPoint[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const points: SeriesPoint[] = [];
  for (let date = since; date <= until; date = shiftDate(date, 1)) {
    const row = byDate.get(date);
    points.push({
      date,
      spend: round2(row?.spend ?? 0),
      revenue: round2(row?.revenue ?? 0),
      roas: row !== undefined && row.spend > 0 ? round2(row.revenue / row.spend) : null,
    });
  }
  return points;
}

function embeddedAdSetInput(accountId: string, campaignId: string, window: ResolvedWindow): PagedListInput {
  return {
    accountId,
    since: window.since,
    until: window.until,
    statuses: STATUS_GROUPS.active,
    q: null,
    campaignId,
    sort: "spend",
    order: "desc",
    page: 1,
    pageSize: LIST_PAGE_MAX,
  };
}

function embeddedAdInput(accountId: string, campaignId: string, window: ResolvedWindow): AdsPageInput {
  return {
    accountId,
    since: window.since,
    until: window.until,
    ...trendWindows(window),
    filters: {
      statuses: STATUS_GROUPS.active,
      adSetId: null,
      campaignId,
      flag: null,
      format: null,
      q: null,
    },
    sort: "spend",
    order: "desc",
    cursor: null,
    limit: EMBEDDED_ADS_LIMIT,
  };
}

function campaignHeader(campaign: {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  currency: string;
}, sums: WindowSums | undefined): CampaignPerformance {
  const metrics = deriveWindowMetrics(sums);
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    dailyBudget: campaign.dailyBudget,
    lifetimeBudget: campaign.lifetimeBudget,
    currency: campaign.currency,
    spend: metrics.spend,
    revenue: metrics.revenue,
    purchases: metrics.purchases,
    roas: metrics.roas,
    cpa: metrics.cpa,
    ctr: metrics.ctr,
    frequency: metrics.frequency,
  };
}

function campaignPrev(sums: WindowSums | undefined): CampaignPrev {
  const metrics = deriveWindowMetrics(sums);
  return {
    spend: metrics.spend,
    revenue: metrics.revenue,
    purchases: metrics.purchases,
    roas: metrics.roas,
    cpa: metrics.cpa,
    ctr: metrics.ctr,
    frequency: metrics.frequency,
  };
}

function campaignFunnel(sums: WindowSums | undefined): CampaignFunnel {
  return {
    impressions: sums?.impressions ?? 0,
    reach: sums?.reach ?? 0,
    clicks: sums?.clicks ?? 0,
    landingPageViews: sums?.landingPageViews ?? 0,
    addToCart: sums?.addToCart ?? 0,
    initiateCheckout: sums?.initiateCheckout ?? 0,
    purchases: sums?.purchases ?? 0,
    revenue: round2(sums?.revenue ?? 0),
  };
}

export async function campaignDetail(
  deps: CampaignDetailDeps,
  accountId: string,
  campaignId: string,
  query: WindowQuery = {}
): Promise<CampaignDetailPayload> {
  const account = await deps.findAccount(accountId);
  if (account === undefined) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${accountId}`);
  }
  const campaign = await deps.findCampaign(campaignId);
  if (campaign === undefined || campaign.adAccountId !== accountId) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No campaign with id ${campaignId}`);
  }
  const window = resolveWindow(query);
  const prevUntil = shiftDate(window.since, -1);
  const prevSince = shiftDate(window.since, -window.spanDays);
  const [sumsRows, prevSumsRows, seriesRows, adSetRows, adRows] = await Promise.all([
    deps.windowMetrics(accountId, "campaign", window.since, window.until),
    deps.windowMetrics(accountId, "campaign", prevSince, prevUntil),
    deps.campaignSeries(accountId, campaignId, window.since, window.until),
    deps.pageAdSets(embeddedAdSetInput(accountId, campaignId, window)),
    deps.pageAds(embeddedAdInput(accountId, campaignId, window)),
  ]);
  const sums = sumsRows.find((row) => row.entityId === campaignId);
  const prevSums = prevSumsRows.find((row) => row.entityId === campaignId);
  return {
    adAccountId: campaign.adAccountId,
    adAccountPlatformId: campaign.adAccountPlatformId,
    accountName: campaign.accountName,
    campaign: campaignHeader(campaign, sums),
    prev: campaignPrev(prevSums),
    series: buildSeries(window.since, window.until, seriesRows),
    funnel: campaignFunnel(sums),
    adSets: adSetRows.rows.map(toAdSetItem),
    ads: adRows.map(toAdPerformance),
  };
}
