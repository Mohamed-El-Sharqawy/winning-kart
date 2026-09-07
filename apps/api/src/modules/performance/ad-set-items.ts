import { deriveWindowMetrics } from "./ads-metrics";
import type { AdsSums } from "./ads-decoration";

export interface AdSetDbRow {
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
  sums: AdsSums | null;
}

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

export type AdSetItem = AdSetPerformance;

export function toAdSetItem(row: AdSetDbRow): AdSetItem {
  const metrics = deriveWindowMetrics(row.sums);
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
    spend: metrics.spend,
    revenue: metrics.revenue,
    purchases: metrics.purchases,
    roas: metrics.roas,
    cpa: metrics.cpa,
    ctr: metrics.ctr,
    cpc: metrics.cpc,
    cpm: metrics.cpm,
    frequency: metrics.frequency,
    reach: metrics.reach,
  };
}
