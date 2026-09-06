import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { AdsSort } from "./ads-query";
import { escapeLikePattern, sortExprs } from "./ads-where";
import type { ListFilters } from "./list-query";

export const WIN_SORT_EXPRS: Record<AdsSort, SQL> = sortExprs(
  sql`w.spend`,
  sql`w.revenue`,
  sql`w.clicks`,
  sql`w.impressions`,
  sql`w.reach`
);

export function winCte(
  accountId: string,
  level: "campaign" | "adset",
  since: string,
  until: string
): SQL {
  return sql`win as (
    select d.entity_id,
      sum(d.spend)::float8 as spend,
      sum(d.revenue)::float8 as revenue,
      sum(d.purchases)::int as purchases,
      sum(d.clicks)::float8 as clicks,
      sum(d.impressions)::float8 as impressions,
      sum(d.reach)::float8 as reach
    from daily_insights d
    where d.ad_account_id = ${accountId}
      and d.entity_level = ${level}
      and d.date between ${since} and ${until}
    group by d.entity_id
  )`;
}

function statusIn(column: SQL, statuses: readonly string[]): SQL {
  return sql`${column} in (${sql.join(
    statuses.map((value) => sql`${value}`),
    sql`, `
  )})`;
}

function nameIlike(column: SQL, q: string): SQL {
  const pattern = `%${escapeLikePattern(q)}%`;
  return sql`${column} ilike ${pattern} escape ${sql.raw("'\\'")}`;
}

export function campaignWhere(accountId: string, filters: ListFilters): SQL {
  let where = sql`c.ad_account_id = ${accountId} and ${statusIn(sql`c.status`, filters.statuses)}`;
  if (filters.q !== null) {
    where = sql`${where} and ${nameIlike(sql`c.name`, filters.q)}`;
  }
  return where;
}

export function adSetWhere(accountId: string, filters: ListFilters): SQL {
  let where = sql`c.ad_account_id = ${accountId} and ${statusIn(sql`s.status`, filters.statuses)}`;
  if (filters.campaignId !== null) {
    where = sql`${where} and s.campaign_id = ${filters.campaignId}`;
  }
  if (filters.q !== null) {
    where = sql`${where} and ${nameIlike(sql`s.name`, filters.q)}`;
  }
  return where;
}
