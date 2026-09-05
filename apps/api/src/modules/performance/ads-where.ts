import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { AdsCursor } from "./ads-cursor";
import type { AdsFilters, AdsOrder, AdsSort } from "./ads-query";

export const SORT_EXPRS: Record<AdsSort, SQL> = {
  spend: sql`p.spend`,
  roas: sql`case when p.spend > 0 then p.revenue / p.spend end`,
  ctr: sql`case when p.impressions > 0 then p.clicks * 100.0 / p.impressions end`,
  frequency: sql`case when p.reach > 0 then p.impressions / p.reach end`,
};

export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}

export function filterSql(filters: AdsFilters): SQL {
  const chunks: SQL[] = [];
  chunks.push(
    sql` and a.status in (${sql.join(
      filters.statuses.map((value) => sql`${value}`),
      sql`, `
    )})`
  );
  if (filters.adSetId !== null) {
    chunks.push(sql` and a.ad_set_id = ${filters.adSetId}`);
  }
  if (filters.campaignId !== null) {
    chunks.push(sql` and c.id = ${filters.campaignId}`);
  }
  if (filters.format !== null) {
    chunks.push(sql` and a.format = ${filters.format}`);
  }
  if (filters.q !== null) {
    const pattern = `%${escapeLikePattern(filters.q)}%`;
    chunks.push(
      sql` and (a.name ilike ${pattern} escape ${sql.raw("'\\'")} or a.body_copy ilike ${pattern} escape ${sql.raw("'\\'")})`
    );
  }
  return sql.join(chunks, sql``);
}

export function cursorSql(cursor: AdsCursor, order: AdsOrder): SQL {
  if (cursor.sortValue === null) {
    return sql` where t."sortValue" is null and t.id > ${cursor.id}`;
  }
  const comparator = order === "desc" ? sql`<` : sql`>`;
  return sql` where (t."sortValue" is not null and (t."sortValue" ${comparator} ${cursor.sortValue} or (t."sortValue" = ${cursor.sortValue} and t.id > ${cursor.id}))) or t."sortValue" is null`;
}
