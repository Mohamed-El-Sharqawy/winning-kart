import { classifyAd, cohortStats } from "../../detection/fatigue";
import type { CohortAdRow, FatigueFinding } from "../../detection/fatigue";
import { problem } from "../../lib/problem";
import { round2 } from "../../platforms/meta";
import { utcWindow } from "../ad-accounts/service";
import type {
  AdSetEntityRow,
  AdTrendSums,
  CampaignDailyRow,
  WindowSums,
} from "./model";
import type { PerformanceModel } from "./model";

export interface AdSetPerformance {
  id: string;
  campaignId: string;
  campaignName: string;
  platformAdsetId: string;
  name: string;
  status: string;
  optimizationGoal: string | null;
  bidStrategy: string | null;
  dailyBudget: string | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  frequency: number | null;
  reach: number | null;
}

export interface AdPerformance {
  id: string;
  adSetId: string;
  adSetName: string;
  campaignName: string;
  platformAdId: string;
  name: string;
  status: string;
  format: string | null;
  creativeId: string | null;
  thumbnailUrl: string | null;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  bodyCopy: string | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  fatigue: FatigueFinding | null;
}

export interface SeriesPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

export interface CampaignFunnel {
  impressions: number;
  reach: number;
  clicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  revenue: number;
}

export interface CampaignDetailPayload {
  adAccountId: string;
  adAccountPlatformId: string;
  accountName: string;
  campaign: CampaignPerformance;
  series: SeriesPoint[];
  funnel: CampaignFunnel;
  adSets: AdSetPerformance[];
  ads: AdPerformance[];
}

export interface FatigueSummaryPayload {
  topCreativeSpendShare: number | null;
  top3SpendShare: number | null;
  concentration: "top1" | "top3" | null;
  counts: { fatiguing: number; bleeding: number; scale: number; status_anomaly: number };
}

const DAY_MS = 86400000;

function accountNotFound(id: string) {
  return problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${id}`);
}

function campaignNotFound(id: string) {
  return problem(404, "RESOURCE_NOT_FOUND", `No campaign with id ${id}`);
}

function shiftDate(date: string, offsetDays: number): string {
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + offsetDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function laterDate(a: string, b: string): string {
  return a >= b ? a : b;
}

function ctrRate(clicks: number, impressions: number): number | null {
  return impressions > 0 ? (clicks / impressions) * 100 : null;
}

function deriveMetrics(sums: WindowSums | undefined) {
  if (sums === undefined) {
    return {
      spend: null,
      revenue: null,
      purchases: null,
      roas: null,
      cpa: null,
      ctr: null,
      cpc: null,
      cpm: null,
      frequency: null,
      reach: null,
    };
  }
  return {
    spend: round2(sums.spend),
    revenue: round2(sums.revenue),
    purchases: sums.purchases,
    roas: sums.spend > 0 ? round2(sums.revenue / sums.spend) : null,
    cpa: sums.purchases > 0 ? round2(sums.spend / sums.purchases) : null,
    ctr: sums.impressions > 0 ? round2((sums.clicks / sums.impressions) * 100) : null,
    cpc: sums.clicks > 0 ? round2(sums.spend / sums.clicks) : null,
    cpm: sums.impressions > 0 ? round2((sums.spend / sums.impressions) * 1000) : null,
    frequency: sums.reach > 0 ? round2(sums.impressions / sums.reach) : null,
    reach: sums.reach,
  };
}

function toAdSetItem(row: AdSetEntityRow, sums: WindowSums | undefined): AdSetPerformance {
  return {
    id: row.id,
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    platformAdsetId: row.platformAdsetId,
    name: row.name,
    status: row.status,
    optimizationGoal: row.optimizationGoal,
    bidStrategy: row.bidStrategy,
    dailyBudget: row.dailyBudget,
    currency: row.currency,
    ...deriveMetrics(sums),
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

export class PerformanceService {
  constructor(private readonly model: PerformanceModel) {}

  private async requireAccount(id: string): Promise<void> {
    const account = await this.model.findAccount(id);
    if (account === undefined) {
      throw accountNotFound(id);
    }
  }

  async listAdSets(id: string, days: number): Promise<AdSetPerformance[]> {
    await this.requireAccount(id);
    const { since, until } = utcWindow(days);
    const [rows, sumsRows] = await Promise.all([
      this.model.listAdSets(id),
      this.model.windowMetrics(id, "adset", since, until),
    ]);
    const sumsById = new Map(sumsRows.map((row) => [row.entityId, row]));
    return rows
      .map((row) => toAdSetItem(row, sumsById.get(row.id)))
      .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
  }

  async listAds(id: string, days: number, adSetId?: string): Promise<AdPerformance[]> {
    await this.requireAccount(id);
    return this.buildAdItems(id, days, undefined, adSetId);
  }

  private async buildAdItems(
    id: string,
    days: number,
    campaignId?: string,
    adSetId?: string
  ): Promise<AdPerformance[]> {
    const { since, until } = utcWindow(days);
    const recentSince = laterDate(since, shiftDate(until, -6));
    const priorSince = laterDate(since, shiftDate(recentSince, -7));
    const [allRows, adSumsRows, adSetSumsRows, trendRows] = await Promise.all([
      this.model.listAds(id, adSetId),
      this.model.windowMetrics(id, "ad", since, until),
      this.model.windowMetrics(id, "adset", since, until),
      this.model.adTrendMetrics(id, priorSince, recentSince, until),
    ]);
    const rows =
      campaignId === undefined
        ? allRows
        : allRows.filter((row) => row.campaignId === campaignId);
    const adSumsById = new Map(adSumsRows.map((row) => [row.entityId, row]));
    const cohortSpendById = new Map(adSetSumsRows.map((row) => [row.entityId, row.spend]));
    const trendById = new Map(trendRows.map((row) => [row.entityId, row]));
    const cohortRows: CohortAdRow[] = [];
    const prepared = rows.map((row) => {
      const sums = adSumsById.get(row.id);
      const metrics = deriveMetrics(sums);
      const cohortSpend = cohortSpendById.get(row.adSetId) ?? 0;
      const spendShare = cohortSpend > 0 ? (sums?.spend ?? 0) / cohortSpend : null;
      const trend = trendById.get(row.id);
      cohortRows.push({ adSetId: row.adSetId, roas: metrics.roas, spendRecent: trend?.spendRecent ?? 0 });
      return { row, metrics, spendShare, trend };
    });
    const stats = cohortStats(cohortRows);
    return prepared
      .map(({ row, metrics, spendShare, trend }) => {
        const stat = stats.get(row.adSetId);
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
          previewImageUrl: row.previewImageUrl,
          previewVideoUrl: row.previewVideoUrl,
          bodyCopy: row.bodyCopy,
          spend: metrics.spend,
          revenue: metrics.revenue,
          purchases: metrics.purchases,
          roas: metrics.roas,
          cpa: metrics.cpa,
          ctr: metrics.ctr,
          frequency: metrics.frequency,
          spendShare: spendShare === null ? null : round2(spendShare),
          fatigue: classifyAd({
            adId: row.id,
            adStatus: row.status,
            parentAdSetStatus: row.parentAdSetStatus,
            spendRecent: trend?.spendRecent ?? 0,
            spendPrior: trend?.spendPrior ?? 0,
            ctrRecent: trend === undefined ? null : ctrRate(trend.clicksRecent, trend.impressionsRecent),
            ctrPrior: trend === undefined ? null : ctrRate(trend.clicksPrior, trend.impressionsPrior),
            frequency: metrics.frequency,
            roas: metrics.roas,
            spendShare,
            cohortMedianRoas: stat === undefined ? null : stat.medianRoas,
            cohortMedianSpend: stat === undefined ? null : stat.medianSpend,
          }),
        };
      })
      .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
  }

  async campaignDetail(
    id: string,
    campaignId: string,
    days: number
  ): Promise<CampaignDetailPayload> {
    await this.requireAccount(id);
    const campaign = await this.model.findCampaign(campaignId);
    if (campaign === undefined || campaign.adAccountId !== id) {
      throw campaignNotFound(campaignId);
    }
    const { since, until } = utcWindow(days);
    const [sumsRows, seriesRows, adSetItems, adItems] = await Promise.all([
      this.model.windowMetrics(id, "campaign", since, until),
      this.model.campaignSeries(id, campaignId, since, until),
      this.listAdSets(id, days),
      this.buildAdItems(id, days, campaignId),
    ]);
    const sums = sumsRows.find((row) => row.entityId === campaignId);
    const metrics = deriveMetrics(sums);
    return {
      adAccountId: campaign.adAccountId,
      adAccountPlatformId: campaign.adAccountPlatformId,
      accountName: campaign.accountName,
      campaign: {
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
      },
      series: buildSeries(since, until, seriesRows),
      funnel: {
        impressions: sums?.impressions ?? 0,
        reach: sums?.reach ?? 0,
        clicks: sums?.clicks ?? 0,
        landingPageViews: sums?.landingPageViews ?? 0,
        addToCart: sums?.addToCart ?? 0,
        initiateCheckout: sums?.initiateCheckout ?? 0,
        purchases: sums?.purchases ?? 0,
        revenue: round2(sums?.revenue ?? 0),
      },
      adSets: adSetItems.filter((item) => item.campaignId === campaignId),
      ads: adItems.slice(0, 10),
    };
  }

  async fatigueSummary(id: string, days: number): Promise<FatigueSummaryPayload> {
    await this.requireAccount(id);
    const items = await this.buildAdItems(id, days);
    const spends = items
      .map((item) => item.spend)
      .filter((spend): spend is number => spend !== null && spend > 0)
      .sort((a, b) => b - a);
    const accountSpend = spends.reduce((sum, spend) => sum + spend, 0);
    const top1 = accountSpend > 0 && spends.length > 0 ? round2(spends[0] / accountSpend) : null;
    const top3 =
      accountSpend > 0 && spends.length > 0
        ? round2(spends.slice(0, 3).reduce((sum, spend) => sum + spend, 0) / accountSpend)
        : null;
    const counts = { fatiguing: 0, bleeding: 0, scale: 0, status_anomaly: 0 };
    for (const item of items) {
      if (item.fatigue !== null) {
        counts[item.fatigue.flag] += 1;
      }
    }
    return {
      topCreativeSpendShare: top1,
      top3SpendShare: top3,
      concentration:
        top1 !== null && top1 >= 0.5 ? "top1" : top3 !== null && top3 >= 0.8 ? "top3" : null,
      counts,
    };
  }
}
