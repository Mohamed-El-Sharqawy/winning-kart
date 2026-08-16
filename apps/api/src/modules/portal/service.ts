import { round2 } from "../../platforms/meta";
import { utcWindow } from "../ad-accounts/service";
import type { PortalClientRow } from "./model";
import type { PortalModel } from "./model";

export interface PortalKpis {
  spend: number;
  revenue: number;
  roas: number | null;
  purchases: number;
}

export interface PortalSeriesPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface PortalCampaignView {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  roas: number | null;
  purchases: number;
}

export interface PortalCreativeView {
  id: string;
  name: string;
  format: string | null;
  thumbnailUrl: string | null;
  spend: number;
  roas: number | null;
}

export interface PortalOverviewPayload {
  client: { name: string; slug: string; displayCurrency: string };
  kpis: PortalKpis;
  series: PortalSeriesPoint[];
  campaigns: PortalCampaignView[];
  creatives: PortalCreativeView[];
}

const DAY_MS = 86400000;

export class PortalService {
  constructor(private readonly model: PortalModel) {}

  async overview(client: PortalClientRow, days: number): Promise<PortalOverviewPayload> {
    const { since } = utcWindow(days);
    const accountIds = await this.model.accountIdsForClient(client.id);
    const [dailyRows, campaignRows, creativeRows] = await Promise.all([
      this.model.accountDailySince(accountIds, since),
      this.model.campaignMetricsSince(accountIds, since),
      this.model.creativeMetricsSince(accountIds, since),
    ]);
    const totalsByDate = new Map(dailyRows.map((row) => [row.date, row]));
    const series: PortalSeriesPoint[] = [];
    let spend = 0;
    let revenue = 0;
    let purchases = 0;
    const sinceMs = Date.parse(`${since}T00:00:00Z`);
    for (let i = 0; i < days; i += 1) {
      const date = new Date(sinceMs + i * DAY_MS).toISOString().slice(0, 10);
      const row = totalsByDate.get(date);
      const daySpend = round2(row?.spend ?? 0);
      const dayRevenue = round2(row?.revenue ?? 0);
      spend += row?.spend ?? 0;
      revenue += row?.revenue ?? 0;
      purchases += row?.purchases ?? 0;
      series.push({
        date,
        spend: daySpend,
        revenue: dayRevenue,
        roas: daySpend > 0 ? round2(dayRevenue / daySpend) : null,
      });
    }
    return {
      client: { name: client.name, slug: client.slug, displayCurrency: client.displayCurrency },
      kpis: {
        spend: round2(spend),
        revenue: round2(revenue),
        roas: spend > 0 ? round2(revenue / spend) : null,
        purchases,
      },
      series,
      campaigns: campaignRows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        spend: round2(row.spend),
        revenue: round2(row.revenue),
        roas: row.spend > 0 ? round2(row.revenue / row.spend) : null,
        purchases: row.purchases,
      })),
      creatives: creativeRows.map((row) => ({
        id: row.id,
        name: row.name,
        format: row.format,
        thumbnailUrl: row.thumbnailUrl,
        spend: round2(row.spend),
        roas: row.spend > 0 ? round2(row.revenue / row.spend) : null,
      })),
    };
  }
}
