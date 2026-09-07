import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@wk/db";
import type { AdsCursor } from "./ads-cursor";
import type { AdsFilters, AdsOrder, AdsSort } from "./ads-query";
import type { AdsRow } from "./ads-decoration";
import { SORT_EXPRS, cursorSql, filterSql } from "./ads-where";
import { toAdsRow } from "./ads-rows";
import type { AdsPageDbRow } from "./ads-rows";

export interface AdsWindowBounds {
  accountId: string;
  since: string;
  until: string;
  recentSince: string;
  priorSince: string;
}

export interface AdsPageInput extends AdsWindowBounds {
  filters: AdsFilters;
  sort: AdsSort;
  order: AdsOrder;
  cursor: AdsCursor | null;
  limit: number;
}

export interface AdFindInput extends AdsWindowBounds {
  adId: string;
}

function adsRowsQuery(
  bounds: AdsWindowBounds,
  where: SQL,
  sort: AdsSort,
  order: AdsOrder | null,
  cursor: AdsCursor | null,
  limit: number
): SQL {
  const { accountId, since, until, recentSince, priorSince } = bounds;
  const direction = order === "desc" ? sql.raw("desc") : sql.raw("asc");
  const cursorFilter = cursor === null || order === null ? sql`` : cursorSql(cursor, order);
  const orderClause =
    order === null ? sql`` : sql`order by t."sortValue" ${direction} nulls last, t.id asc`;
  return sql`
    with per_ad as (
      select
        d.entity_id,
        sum(d.spend) filter (where d.date >= ${since})::float8 as spend,
        sum(d.revenue) filter (where d.date >= ${since})::float8 as revenue,
        sum(d.purchases) filter (where d.date >= ${since})::int as purchases,
        sum(d.clicks) filter (where d.date >= ${since})::float8 as clicks,
        sum(d.impressions) filter (where d.date >= ${since})::float8 as impressions,
        sum(d.reach) filter (where d.date >= ${since})::float8 as reach,
        sum(d.spend) filter (where d.date >= ${recentSince})::float8 as spend_recent,
        sum(d.spend) filter (where d.date >= ${priorSince} and d.date < ${recentSince})::float8 as spend_prior,
        sum(d.clicks) filter (where d.date >= ${recentSince})::float8 as clicks_recent,
        sum(d.clicks) filter (where d.date >= ${priorSince} and d.date < ${recentSince})::float8 as clicks_prior,
        sum(d.impressions) filter (where d.date >= ${recentSince})::float8 as impressions_recent,
        sum(d.impressions) filter (where d.date >= ${priorSince} and d.date < ${recentSince})::float8 as impressions_prior
      from daily_insights d
      where d.ad_account_id = ${accountId}
        and d.entity_level = 'ad'
        and d.date between ${priorSince} and ${until}
      group by d.entity_id
    ),
    cohort as (
      select d.entity_id, sum(d.spend)::float8 as spend
      from daily_insights d
      where d.ad_account_id = ${accountId}
        and d.entity_level = 'adset'
        and d.date between ${since} and ${until}
      group by d.entity_id
    ),
    medians as (
      select a.ad_set_id,
        percentile_cont(0.5) within group (order by case when p.spend > 0 then p.revenue / p.spend end) as median_roas,
        percentile_cont(0.5) within group (order by coalesce(p.spend_recent, 0)) as median_spend
      from ads a
      left join per_ad p on p.entity_id = a.id
      join ad_sets s on s.id = a.ad_set_id
      join campaigns c on c.id = s.campaign_id
      where c.ad_account_id = ${accountId}
      group by a.ad_set_id
    )
    select * from (
      select
        a.id,
        a.ad_set_id as "adSetId",
        s.name as "adSetName",
        c.id as "campaignId",
        c.name as "campaignName",
        a.platform_ad_id as "platformAdId",
        a.name,
        a.status,
        a.format,
        a.creative_id as "creativeId",
        a.video_id as "videoId",
        a.carousel_count as "carouselCount",
        a.thumbnail_url as "thumbnailUrl",
        a.thumbnail_resolved_at as "thumbnailResolvedAt",
        a.poster_url as "posterUrl",
        a.poster_resolved_at as "posterResolvedAt",
        a.source_url as "sourceUrl",
        a.source_resolved_at as "sourceResolvedAt",
        a.body_copy as "bodyCopy",
        s.status as "parentAdSetStatus",
        p.spend,
        p.revenue,
        p.purchases,
        p.clicks,
        p.impressions,
        p.reach,
        p.spend_recent as "spendRecent",
        p.spend_prior as "spendPrior",
        p.clicks_recent as "clicksRecent",
        p.clicks_prior as "clicksPrior",
        p.impressions_recent as "impressionsRecent",
        p.impressions_prior as "impressionsPrior",
        case when co.spend > 0 then coalesce(p.spend, 0) / co.spend end as "spendShare",
        m.median_roas as "medianRoas",
        m.median_spend as "medianSpend",
        ${SORT_EXPRS[sort]} as "sortValue"
      from ads a
      join ad_sets s on s.id = a.ad_set_id
      join campaigns c on c.id = s.campaign_id
      left join per_ad p on p.entity_id = a.id
      left join cohort co on co.entity_id = a.ad_set_id
      left join medians m on m.ad_set_id = a.ad_set_id
      where ${where}
    ) t${cursorFilter}
    ${orderClause}
    limit ${limit}`;
}

export class AdsRepository {
  async pageAds(input: AdsPageInput): Promise<AdsRow[]> {
    const where = sql`c.ad_account_id = ${input.accountId}${filterSql(input.filters)}`;
    return this.run(adsRowsQuery(input, where, input.sort, input.order, input.cursor, input.limit));
  }

  async findAd(input: AdFindInput): Promise<AdsRow | undefined> {
    const where = sql`c.ad_account_id = ${input.accountId} and a.id = ${input.adId}`;
    const rows = await this.run(adsRowsQuery(input, where, "spend", null, null, 1));
    return rows[0];
  }

  private async run(query: SQL): Promise<AdsRow[]> {
    const rows = (await db.execute(query)) as unknown as AdsPageDbRow[];
    return rows.map(toAdsRow);
  }
}
