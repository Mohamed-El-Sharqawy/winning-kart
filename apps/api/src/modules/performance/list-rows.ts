import type { AdsSums } from "./ads-decoration";
import type { AdSetDbRow } from "./ad-set-items";
import type { CampaignDbRow } from "./campaign-items";

interface SumsColumns {
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  clicks: number | null;
  impressions: number | null;
  reach: number | null;
}

export interface CampaignFlatDbRow extends SumsColumns {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  buyingType: string | null;
  currency: string;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  scheduleStart: string | Date | null;
  scheduleEnd: string | Date | null;
}

export interface AdSetFlatDbRow extends SumsColumns {
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
}

export interface SummaryTotalsRow {
  spend: number;
  revenue: number;
  purchases: number;
  clicks: number;
  impressions: number;
  reach: number;
}

function toSums(row: SumsColumns): AdsSums | null {
  return row.spend === null ||
    row.revenue === null ||
    row.purchases === null ||
    row.clicks === null ||
    row.impressions === null ||
    row.reach === null
    ? null
    : {
        spend: row.spend,
        revenue: row.revenue,
        purchases: row.purchases,
        clicks: row.clicks,
        impressions: row.impressions,
        reach: row.reach,
      };
}

export function toCampaignDbRow(row: CampaignFlatDbRow): CampaignDbRow {
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
    sums: toSums(row),
  };
}

export function toAdSetDbRow(row: AdSetFlatDbRow): AdSetDbRow {
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
    sums: toSums(row),
  };
}

export function toSummarySums(row: SummaryTotalsRow): AdsSums {
  return {
    spend: row.spend,
    revenue: row.revenue,
    purchases: row.purchases,
    clicks: row.clicks,
    impressions: row.impressions,
    reach: row.reach,
  };
}
