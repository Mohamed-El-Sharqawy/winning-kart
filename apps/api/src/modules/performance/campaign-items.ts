import { deriveAdMetrics, deriveWindowMetrics } from "./ads-metrics";
import type { AdItemMetrics } from "./ads-metrics";
import type { AdsSums } from "./ads-decoration";

export interface CampaignDbRow {
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
  sums: AdsSums | null;
}

export interface CampaignItem extends AdItemMetrics {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  buyingType: string | null;
  currency: string;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
}

export interface KpiSummary {
  spend: number;
  revenue: number;
  purchases: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

const NULL_METRICS: AdItemMetrics = {
  spend: null,
  revenue: null,
  purchases: null,
  roas: null,
  cpa: null,
  ctr: null,
  frequency: null,
};

function toIso(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const normalized = value.replace(" ", "T");
  const withZone = /\+\d\d$/.test(normalized) ? `${normalized}:00` : normalized;
  const parsed = new Date(withZone);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function toCampaignItem(row: CampaignDbRow): CampaignItem {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    objective: row.objective,
    buyingType: row.buyingType,
    currency: row.currency,
    dailyBudget: row.dailyBudget,
    lifetimeBudget: row.lifetimeBudget,
    scheduleStart: toIso(row.scheduleStart),
    scheduleEnd: toIso(row.scheduleEnd),
    ...(deriveAdMetrics(row.sums) ?? NULL_METRICS),
  };
}

export function toSummary(sums: AdsSums): KpiSummary {
  const metrics = deriveWindowMetrics(sums);
  return {
    spend: metrics.spend ?? 0,
    revenue: metrics.revenue ?? 0,
    purchases: metrics.purchases ?? 0,
    roas: metrics.roas,
    cpa: metrics.cpa,
    ctr: metrics.ctr,
    frequency: metrics.frequency,
  };
}
