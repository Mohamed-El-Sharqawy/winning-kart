import type { ResolvedWindow } from "../../lib/window";
import { round2 } from "../../platforms/meta";
import { classifyAdsRow } from "./ads-decoration";
import type { AdsRow } from "./ads-decoration";
import { deriveAdMetrics } from "./ads-metrics";
import { trendWindows } from "./ads-list";
import { STATUS_GROUPS } from "./ads-query";
import { applyThumbnailRefresh, refreshPageThumbnails } from "./ads-refresh";
import type { PageRefresher } from "./ads-refresh";
import type { AdsPageInput } from "./ads-repository";
import { toAdSetItem } from "./ad-set-items";
import type { AdSetDbRow, AdSetPerformance } from "./ad-set-items";
import type { AdPerformance } from "./campaign-detail-types";
import { LIST_PAGE_MAX } from "./list-query";
import type { PagedListInput, PagedRows } from "./list-repository";

const EMBEDDED_ADS_LIMIT = 10;

export interface EmbeddedListDeps {
  pageAdSets(input: PagedListInput): Promise<PagedRows<AdSetDbRow>>;
  pageAds(input: AdsPageInput): Promise<AdsRow[]>;
  refresher: PageRefresher;
}

function toAdPerformance(row: AdsRow): AdPerformance {
  const metrics = deriveAdMetrics(row.sums);
  return {
    id: row.id,
    adSetId: row.adSetId,
    adSetName: row.adSetName,
    campaignName: row.campaignName,
    platformAdId: row.platformAdId,
    name: row.name,
    status: row.status,
    format: row.format,
    creativeId: row.creativeId,
    thumbnailUrl: row.thumbnailUrl,
    bodyCopy: row.bodyCopy,
    spend: metrics?.spend ?? null,
    revenue: metrics?.revenue ?? null,
    purchases: metrics?.purchases ?? null,
    roas: metrics?.roas ?? null,
    cpa: metrics?.cpa ?? null,
    ctr: metrics?.ctr ?? null,
    frequency: metrics?.frequency ?? null,
    spendShare: row.spendShare === null ? null : round2(row.spendShare),
    fatigue: classifyAdsRow(row, metrics),
  };
}

export async function embeddedAdSets(
  deps: EmbeddedListDeps,
  accountId: string,
  campaignId: string,
  window: ResolvedWindow
): Promise<AdSetPerformance[]> {
  const input: PagedListInput = {
    accountId,
    since: window.since,
    until: window.until,
    statuses: STATUS_GROUPS.active,
    q: null,
    campaignId,
    sort: "spend",
    order: "desc",
    page: 1,
    pageSize: LIST_PAGE_MAX,
  };
  const { rows } = await deps.pageAdSets(input);
  return rows.map(toAdSetItem);
}

export async function embeddedAds(
  deps: EmbeddedListDeps,
  accountId: string,
  campaignId: string,
  window: ResolvedWindow
): Promise<AdPerformance[]> {
  const input: AdsPageInput = {
    accountId,
    since: window.since,
    until: window.until,
    ...trendWindows(window),
    filters: {
      statuses: STATUS_GROUPS.active,
      adSetId: null,
      campaignId,
      flag: null,
      format: null,
      q: null,
    },
    sort: "spend",
    order: "desc",
    cursor: null,
    limit: EMBEDDED_ADS_LIMIT,
  };
  const rows = await deps.pageAds(input);
  const refresh = await refreshPageThumbnails(deps.refresher, rows, new Date());
  return applyThumbnailRefresh(rows.map(toAdPerformance), refresh);
}
