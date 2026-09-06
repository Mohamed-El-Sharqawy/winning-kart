import { deriveWindowMetrics } from "../performance/ads-metrics";
import type { CampaignRow, CampaignWindowMetrics } from "./model";

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

export function toCampaignWithMetrics(
  row: CampaignRow,
  metrics: CampaignWindowMetrics | null
): CampaignWithMetrics {
  const derived = deriveWindowMetrics(metrics);
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
    spend: derived.spend,
    revenue: derived.revenue,
    purchases: derived.purchases,
    roas: derived.roas,
    cpa: derived.cpa,
    ctr: derived.ctr,
    frequency: derived.frequency,
  };
}

export function mergeCampaignMetrics(
  rows: CampaignRow[],
  metricsRows: CampaignWindowMetrics[]
): CampaignWithMetrics[] {
  const metricsByEntity = new Map(metricsRows.map((row) => [row.entityId, row]));
  return rows
    .map((row) => toCampaignWithMetrics(row, metricsByEntity.get(row.id) ?? null))
    .sort((a, b) => {
      if (a.spend === null || b.spend === null) {
        return a.spend === b.spend ? 0 : a.spend === null ? 1 : -1;
      }
      return b.spend - a.spend;
    });
}
