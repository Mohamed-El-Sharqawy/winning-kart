import { round2 } from "../../platforms/meta";
import type { AdsSums, AdsTrendSums } from "./ads-decoration";

export interface AdItemMetrics {
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

export interface WindowMetrics extends AdItemMetrics {
  cpc: number | null;
  cpm: number | null;
  reach: number | null;
}

export interface AdTrend {
  spend: number;
  ctr: number | null;
}

export function ctrRate(clicks: number, impressions: number): number | null {
  return impressions > 0 ? (clicks / impressions) * 100 : null;
}

export function deriveWindowMetrics(sums: AdsSums | null | undefined): WindowMetrics {
  if (sums === null || sums === undefined) {
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

export function deriveAdMetrics(sums: AdsSums | null): AdItemMetrics | null {
  if (sums === null) {
    return null;
  }
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

export function deriveAdTrend(trend: AdsTrendSums): AdTrend {
  const ctrRecent = ctrRate(trend.clicksRecent, trend.impressionsRecent);
  const ctrPrior = ctrRate(trend.clicksPrior, trend.impressionsPrior);
  return {
    spend: round2(trend.spendRecent - trend.spendPrior),
    ctr: ctrRecent === null || ctrPrior === null ? null : round2(ctrRecent - ctrPrior),
  };
}
