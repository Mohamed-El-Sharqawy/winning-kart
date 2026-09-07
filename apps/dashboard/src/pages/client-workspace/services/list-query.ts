import type { DateRange } from "@/shared/components/DateRangeControl";
import type { StatusFilter } from "../types/creatives.types";

export interface ListFilters {
  status: StatusFilter;
  q: string;
}

export function windowQuery(range: DateRange, rangeExplicit: boolean): Record<string, string | number> {
  return rangeExplicit ? { from: range.from, to: range.to } : { days: 30 };
}

export function listFilterQuery(
  filters: ListFilters,
  campaignId?: string,
): Record<string, string | number> {
  const query: Record<string, string | number> = { status: filters.status };
  if (filters.q.trim() !== "") query.q = filters.q.trim();
  if (campaignId !== undefined) query.campaignId = campaignId;
  return query;
}

export function pagedListQuery(
  range: DateRange,
  rangeExplicit: boolean,
  filters: ListFilters,
  campaignId: string | undefined,
  page: number,
  pageSize: number,
): Record<string, string | number> {
  return {
    ...windowQuery(range, rangeExplicit),
    ...listFilterQuery(filters, campaignId),
    page: page + 1,
    pageSize,
  };
}
