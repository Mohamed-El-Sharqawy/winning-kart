import { parseAdsOrder, parseAdsSort, parseAdsStatus, validation } from "./ads-query";

export const LIST_PAGE_SIZE_DEFAULT = 25;
export const LIST_PAGE_SIZE_MAX = 100;
export const LIST_PAGE_MAX = 1000000;

export interface ListPageQuery {
  days?: string;
  from?: string;
  to?: string;
  status?: string;
  q?: string;
  campaignId?: string;
  sort?: string;
  order?: string;
  page?: string;
  pageSize?: string;
}

export interface ListFilters {
  statuses: readonly string[];
  q: string | null;
  campaignId: string | null;
}

export const parseListSort = parseAdsSort;
export const parseListOrder = parseAdsOrder;

function parsePositiveInt(raw: string | undefined, label: string, fallback: number): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  if (!/^\d+$/.test(raw.trim())) {
    validation(`${label} must be a positive integer`);
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 1) {
    validation(`${label} must be a positive integer`);
  }
  return value;
}

export function parseListPage(query: { page?: string; pageSize?: string }): {
  page: number;
  pageSize: number;
} {
  const pageSize = parsePositiveInt(query.pageSize, "pageSize", LIST_PAGE_SIZE_DEFAULT);
  if (pageSize > LIST_PAGE_SIZE_MAX) {
    validation(`pageSize must be between 1 and ${LIST_PAGE_SIZE_MAX}`);
  }
  const page = parsePositiveInt(query.page, "page", 1);
  if (page > LIST_PAGE_MAX) {
    validation(`page must be at most ${LIST_PAGE_MAX}`);
  }
  return { page, pageSize };
}

export function parseListFilters(input: {
  status?: string;
  q?: string;
  campaignId?: string;
}): ListFilters {
  const q = input.q?.trim();
  return {
    statuses: parseAdsStatus(input.status),
    q: q === "" || q === undefined ? null : q,
    campaignId: input.campaignId?.trim() || null,
  };
}
