import { problem } from "../../lib/problem";
import { resolveWindow, shiftDate } from "../../lib/window";
import type { ResolvedWindow } from "../../lib/window";
import { adsCursorContext, decodeAdsCursor, encodeAdsCursor } from "./ads-cursor";
import type { AdsCursor } from "./ads-cursor";
import { classifyAdsRow, decorateAdsPage } from "./ads-decoration";
import { deriveAdMetrics } from "./ads-metrics";
import type { AdItem, AdsRow } from "./ads-decoration";
import { parseAdsFilters, parseAdsLimit, parseAdsOrder, parseAdsSort } from "./ads-query";
import { refreshPageThumbnails, applyThumbnailRefresh } from "./ads-refresh";
import type { PageRefresher } from "./ads-refresh";
import type { AdsPageInput } from "./ads-repository";

export interface AdsListQuery {
  days?: string;
  from?: string;
  to?: string;
  status?: string;
  adSetId?: string;
  campaignId?: string;
  flag?: string;
  format?: string;
  q?: string;
  sort?: string;
  order?: string;
  limit?: string;
  cursor?: string;
}

export interface AdsListDeps {
  findAccount(id: string): Promise<{ id: string } | undefined>;
  pageAds(input: AdsPageInput): Promise<AdsRow[]>;
  refresher: PageRefresher;
}

export interface AdsListPage {
  items: AdItem[];
  nextCursor: string | null;
}

const SCAN_CHUNK = 500;

function laterDate(a: string, b: string): string {
  return a >= b ? a : b;
}

export function trendWindows(window: ResolvedWindow): { recentSince: string; priorSince: string } {
  const recentSince = laterDate(window.since, shiftDate(window.until, -6));
  const priorSince = laterDate(window.since, shiftDate(recentSince, -7));
  return { recentSince, priorSince };
}

export function adsListContext(query: AdsListQuery): string {
  const window = resolveWindow(query);
  const filters = parseAdsFilters(query);
  const sort = parseAdsSort(query.sort);
  const order = parseAdsOrder(query.order);
  return adsCursorContext({
    statuses: [...filters.statuses],
    adSetId: filters.adSetId,
    campaignId: filters.campaignId,
    flag: filters.flag,
    format: filters.format,
    q: filters.q,
    since: window.since,
    until: window.until,
    sort,
    order,
  });
}

function pageInput(
  accountId: string,
  window: ResolvedWindow,
  filters: ReturnType<typeof parseAdsFilters>,
  sort: ReturnType<typeof parseAdsSort>,
  order: ReturnType<typeof parseAdsOrder>,
  cursor: AdsCursor | null,
  limit: number
): AdsPageInput {
  const { recentSince, priorSince } = trendWindows(window);
  return { accountId, since: window.since, until: window.until, recentSince, priorSince, filters, sort, order, cursor, limit };
}

async function collectFlagMatches(
  deps: AdsListDeps,
  input: Omit<AdsPageInput, "cursor" | "limit">,
  flag: NonNullable<AdsPageInput["filters"]["flag"]>,
  cursor: AdsCursor | null,
  limit: number
): Promise<AdsRow[]> {
  const matches: AdsRow[] = [];
  let scanCursor = cursor;
  let exhausted = false;
  while (matches.length <= limit && !exhausted) {
    const chunk = await deps.pageAds({ ...input, cursor: scanCursor, limit: SCAN_CHUNK });
    for (const row of chunk) {
      const finding = classifyAdsRow(row, deriveAdMetrics(row.sums));
      if (finding !== null && finding.flag === flag) {
        matches.push(row);
      }
    }
    if (chunk.length < SCAN_CHUNK) {
      exhausted = true;
    } else {
      const last = chunk[chunk.length - 1];
      scanCursor = { id: last.id, sortValue: last.sortValue };
    }
  }
  return matches;
}

export async function listAdsPage(
  deps: AdsListDeps,
  accountId: string,
  query: AdsListQuery
): Promise<AdsListPage> {
  const account = await deps.findAccount(accountId);
  if (account === undefined) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${accountId}`);
  }
  const window = resolveWindow(query);
  const filters = parseAdsFilters(query);
  const sort = parseAdsSort(query.sort);
  const order = parseAdsOrder(query.order);
  const limit = parseAdsLimit(query.limit);
  const ctx = adsListContext(query);
  const rawCursor = query.cursor?.trim() || null;
  const cursor = rawCursor === null ? null : decodeAdsCursor(rawCursor, ctx);
  const base = pageInput(accountId, window, filters, sort, order, cursor, limit);
  const rows =
    filters.flag === null
      ? await deps.pageAds({ ...base, limit: limit + 1 })
      : await collectFlagMatches(deps, base, filters.flag, cursor, limit);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const refresh = await refreshPageThumbnails(deps.refresher, page, new Date());
  const last = page[page.length - 1];
  return {
    items: applyThumbnailRefresh(decorateAdsPage(page), refresh),
    nextCursor: hasMore && last !== undefined ? encodeAdsCursor(last.id, last.sortValue, ctx) : null,
  };
}
