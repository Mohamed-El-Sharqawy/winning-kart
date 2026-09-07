import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { DateRange } from "@/shared/components/DateRangeControl";
import type { KpiSummary } from "../types/kpi-summary.types";
import type { ListPage } from "../types/list-page.types";
import type { AdSetDto } from "../dto/ad-sets.dto";
import type { KpiSummaryDto } from "../dto/kpi-summary.dto";
import { toAdSets } from "../transformers/ad-sets.transformer";
import type { AdSet } from "../types/ad-sets.types";
import { listFilterQuery, pagedListQuery, windowQuery } from "./list-query";
import type { ListFilters } from "./list-query";

export function useAdSets(
  accountId: string | null,
  range: DateRange,
  rangeExplicit: boolean,
  filters: ListFilters,
  campaignId: string | undefined,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: [
      "ad-accounts", accountId, "ad-sets",
      range.from, range.to, rangeExplicit,
      filters, campaignId, page, pageSize,
    ],
    enabled: accountId !== null,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ListPage<AdSet>> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string })["ad-sets"].get({
        query: pagedListQuery(range, rangeExplicit, filters, campaignId, page, pageSize),
      });
      if (error) throw new Error("Failed to load ad sets");
      const payload = body as { data: AdSetDto[]; meta?: { total?: number } };
      return { items: toAdSets(payload.data), total: payload.meta?.total ?? 0 };
    },
  });
}

export function useAdSetsSummary(
  accountId: string | null,
  range: DateRange,
  rangeExplicit: boolean,
  filters: ListFilters,
  campaignId: string | undefined,
) {
  return useQuery({
    queryKey: [
      "ad-accounts", accountId, "ad-sets", "summary",
      range.from, range.to, rangeExplicit,
      filters, campaignId,
    ],
    enabled: accountId !== null,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<KpiSummary> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string })["ad-sets"].summary.get({
        query: { ...windowQuery(range, rangeExplicit), ...listFilterQuery(filters, campaignId) },
      });
      if (error) throw new Error("Failed to load ad set totals");
      return (body as { data: KpiSummaryDto }).data;
    },
  });
}
