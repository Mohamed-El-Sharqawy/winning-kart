import { classifyAd } from "../../detection/fatigue";
import type { FatigueFinding } from "../../detection/fatigue";
import { round2 } from "../../platforms/meta";
import { ctrRate, deriveAdMetrics, deriveAdTrend } from "./ads-metrics";
import type { AdItemMetrics, AdTrend } from "./ads-metrics";

export interface AdsSums {
  spend: number;
  revenue: number;
  purchases: number;
  clicks: number;
  impressions: number;
  reach: number;
}

export interface AdsTrendSums {
  spendRecent: number;
  spendPrior: number;
  clicksRecent: number;
  impressionsRecent: number;
  clicksPrior: number;
  impressionsPrior: number;
}

export interface AdsRow {
  id: string;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  platformAdId: string;
  name: string;
  status: string;
  format: string | null;
  videoId: string | null;
  carouselCount: number | null;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: Date | null;
  bodyCopy: string | null;
  parentAdSetStatus: string;
  sums: AdsSums | null;
  trend: AdsTrendSums;
  spendShare: number | null;
  medianRoas: number | null;
  medianSpend: number | null;
  sortValue: number | null;
}

export interface AdItem {
  id: string;
  name: string;
  status: string;
  format: string | null;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  thumbnailUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
  bodyCopy: string | null;
  metrics: AdItemMetrics | null;
  spendShare: number | null;
  trend: AdTrend;
  fatigue: FatigueFinding | null;
}

export type FatigueCounts = Record<FatigueFinding["flag"], number>;

export function classifyAdsRow(row: AdsRow, metrics: AdItemMetrics | null): FatigueFinding | null {
  return classifyAd({
    adId: row.id,
    adStatus: row.status,
    parentAdSetStatus: row.parentAdSetStatus,
    spendRecent: row.trend.spendRecent,
    spendPrior: row.trend.spendPrior,
    ctrRecent: ctrRate(row.trend.clicksRecent, row.trend.impressionsRecent),
    ctrPrior: ctrRate(row.trend.clicksPrior, row.trend.impressionsPrior),
    frequency: metrics === null ? null : metrics.frequency,
    roas: metrics === null ? null : metrics.roas,
    spendShare: row.spendShare,
    cohortMedianRoas: row.medianRoas,
    cohortMedianSpend: row.medianSpend,
  });
}

export function decorateAdsPage(rows: AdsRow[]): AdItem[] {
  return rows.map((row) => {
    const metrics = deriveAdMetrics(row.sums);
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      format: row.format,
      adSetId: row.adSetId,
      adSetName: row.adSetName,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      thumbnailUrl: row.thumbnailUrl,
      videoId: row.videoId,
      carouselCount: row.carouselCount,
      bodyCopy: row.bodyCopy,
      metrics,
      spendShare: row.spendShare === null ? null : round2(row.spendShare),
      trend: deriveAdTrend(row.trend),
      fatigue: classifyAdsRow(row, metrics),
    };
  });
}

export function fatigueFlagCounts(items: AdItem[]): FatigueCounts {
  const counts: FatigueCounts = { fatiguing: 0, bleeding: 0, scale: 0, status_anomaly: 0 };
  for (const item of items) {
    if (item.fatigue !== null) {
      counts[item.fatigue.flag] += 1;
    }
  }
  return counts;
}
