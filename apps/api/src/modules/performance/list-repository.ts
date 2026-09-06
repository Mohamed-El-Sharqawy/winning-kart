import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@wk/db";
import type { AdsOrder, AdsSort } from "./ads-query";
import type { ListFilters } from "./list-query";
import {
  toAdSetDbRow,
  toCampaignDbRow,
} from "./list-rows";
import type { AdSetDbRow } from "./ad-set-items";
import type { CampaignDbRow } from "./campaign-items";
import { WIN_SORT_EXPRS, adSetWhere, campaignWhere, winCte } from "./list-where";

export interface PagedListInput extends ListFilters {
  accountId: string;
  since: string;
  until: string;
  sort: AdsSort;
  order: AdsOrder;
  page: number;
  pageSize: number;
}

export interface SummaryInput extends ListFilters {
  accountId: string;
  since: string;
  until: string;
}

export interface PagedRows<Row> {
  rows: Row[];
  total: number;
}

function pageTail(input: PagedListInput): SQL {
  const direction = sql.raw(input.order);
  const offset = (input.page - 1) * input.pageSize;
  return sql` order by t."sortValue" ${direction} nulls last, t.id asc
    limit ${input.pageSize} offset ${offset}`;
}

export class ListRepository {
  async pageCampaigns(input: PagedListInput): Promise<PagedRows<CampaignDbRow>> {
    const where = campaignWhere(input.accountId, input);
    const [rows, totals] = await Promise.all([
      this.run(sql`
        with ${winCte(input.accountId, "campaign", input.since, input.until)}
        select * from (
          select
            c.id, c.name, c.status, c.objective,
            c.buying_type as "buyingType",
            c.currency,
            c.daily_budget as "dailyBudget",
            c.lifetime_budget as "lifetimeBudget",
            c.schedule_start as "scheduleStart",
            c.schedule_end as "scheduleEnd",
            w.spend, w.revenue, w.purchases, w.clicks, w.impressions, w.reach,
            ${WIN_SORT_EXPRS[input.sort]} as "sortValue"
          from campaigns c
          left join win w on w.entity_id = c.id
          where ${where}
        ) t${pageTail(input)}
      `),
      this.run(sql`select count(*)::int as total from campaigns c where ${where}`),
    ]);
    return { rows: rows.map(toCampaignRow), total: totalOf(totals) };
  }

  async pageAdSets(input: PagedListInput): Promise<PagedRows<AdSetDbRow>> {
    const where = adSetWhere(input.accountId, input);
    const [rows, totals] = await Promise.all([
      this.run(sql`
        with ${winCte(input.accountId, "adset", input.since, input.until)}
        select * from (
          select
            s.id,
            s.campaign_id as "campaignId",
            c.name as "campaignName",
            s.platform_adset_id as "platformAdsetId",
            s.name,
            s.status,
            s.optimization_goal as "optimizationGoal",
            s.bid_strategy as "bidStrategy",
            s.daily_budget as "dailyBudget",
            c.currency,
            w.spend, w.revenue, w.purchases, w.clicks, w.impressions, w.reach,
            ${WIN_SORT_EXPRS[input.sort]} as "sortValue"
          from ad_sets s
          join campaigns c on c.id = s.campaign_id
          left join win w on w.entity_id = s.id
          where ${where}
        ) t${pageTail(input)}
      `),
      this.run(sql`
        select count(*)::int as total
        from ad_sets s
        join campaigns c on c.id = s.campaign_id
        where ${where}
      `),
    ]);
    return { rows: rows.map(toAdSetRow), total: totalOf(totals) };
  }

  private async run(query: SQL): Promise<Record<string, unknown>[]> {
    return (await db.execute(query)) as unknown as Record<string, unknown>[];
  }
}

function toCampaignRow(row: Record<string, unknown>): CampaignDbRow {
  return toCampaignDbRow(row as unknown as Parameters<typeof toCampaignDbRow>[0]);
}

function toAdSetRow(row: Record<string, unknown>): AdSetDbRow {
  return toAdSetDbRow(row as unknown as Parameters<typeof toAdSetDbRow>[0]);
}

function totalOf(rows: Record<string, unknown>[]): number {
  const row = rows[0] as { total?: unknown } | undefined;
  return typeof row?.total === "number" ? row.total : 0;
}
