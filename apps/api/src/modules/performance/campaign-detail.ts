import { problem } from "../../lib/problem";
import { resolveWindow, shiftDate } from "../../lib/window";
import type { WindowQuery } from "../../lib/window";
import { round2 } from "../../platforms/meta";
import { deriveWindowMetrics } from "./ads-metrics";
import { embeddedAds, embeddedAdSets } from "./campaign-embed";
import type { CampaignDetailDeps } from "./campaign-detail-types";
import type {
  CampaignDetailPayload,
  CampaignFunnel,
  CampaignPerformance,
  CampaignPrev,
  SeriesPoint,
} from "./campaign-detail-types";
import type { CampaignDailyRow, CampaignEntityRow, WindowSums } from "./model";

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

function metricsOf(sums: WindowSums | undefined): CampaignPrev {
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

function campaignHeader(campaign: CampaignEntityRow, sums: WindowSums | undefined): CampaignPerformance {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    dailyBudget: campaign.dailyBudget,
    lifetimeBudget: campaign.lifetimeBudget,
    currency: campaign.currency,
    ...metricsOf(sums),
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
  const [sumsRows, prevSumsRows, seriesRows, adSets, ads] = await Promise.all([
    deps.windowMetrics(accountId, "campaign", window.since, window.until),
    deps.windowMetrics(accountId, "campaign", prevSince, prevUntil),
    deps.campaignSeries(accountId, campaignId, window.since, window.until),
    embeddedAdSets(deps, accountId, campaignId, window),
    embeddedAds(deps, accountId, campaignId, window),
  ]);
  const sums = sumsRows.find((row) => row.entityId === campaignId);
  const prevSums = prevSumsRows.find((row) => row.entityId === campaignId);
  return {
    adAccountId: campaign.adAccountId,
    adAccountPlatformId: campaign.adAccountPlatformId,
    accountName: campaign.accountName,
    campaign: campaignHeader(campaign, sums),
    prev: metricsOf(prevSums),
    series: buildSeries(window.since, window.until, seriesRows),
    funnel: campaignFunnel(sums),
    adSets,
    ads,
  };
}
