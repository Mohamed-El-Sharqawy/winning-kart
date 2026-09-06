import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@wk/db";
import type { AdsSums } from "./ads-decoration";
import type { SummaryInput } from "./list-repository";
import { adSetWhere, campaignWhere, winCte } from "./list-where";

function summarySelect(): SQL {
  return sql`
    coalesce(sum(w.spend), 0)::float8 as spend,
    coalesce(sum(w.revenue), 0)::float8 as revenue,
    coalesce(sum(w.purchases), 0)::int as purchases,
    coalesce(sum(w.clicks), 0)::float8 as clicks,
    coalesce(sum(w.impressions), 0)::float8 as impressions,
    coalesce(sum(w.reach), 0)::float8 as reach`;
}

function toSums(row: Record<string, unknown>): AdsSums {
  const sums = row as unknown as AdsSums;
  return sums;
}

export class ListSummaryRepository {
  async campaignSummary(input: SummaryInput): Promise<AdsSums> {
    const where = campaignWhere(input.accountId, input);
    const rows = await this.run(sql`
      with ${winCte(input.accountId, "campaign", input.since, input.until)}
      select ${summarySelect()}
      from campaigns c
      left join win w on w.entity_id = c.id
      where ${where}
    `);
    return toSums(rows[0] ?? {});
  }

  async adSetSummary(input: SummaryInput): Promise<AdsSums> {
    const where = adSetWhere(input.accountId, input);
    const rows = await this.run(sql`
      with ${winCte(input.accountId, "adset", input.since, input.until)}
      select ${summarySelect()}
      from ad_sets s
      join campaigns c on c.id = s.campaign_id
      left join win w on w.entity_id = s.id
      where ${where}
    `);
    return toSums(rows[0] ?? {});
  }

  private async run(query: SQL): Promise<Record<string, unknown>[]> {
    return (await db.execute(query)) as unknown as Record<string, unknown>[];
  }
}
