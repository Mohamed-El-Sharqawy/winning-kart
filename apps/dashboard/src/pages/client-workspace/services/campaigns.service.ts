import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { DateRange } from "@/shared/components/DateRangeControl";
import type { KpiSummary } from "../types/kpi-summary.types";
import type { ListPage } from "../types/list-page.types";
import type { CampaignDto } from "../dto/ad-accounts.dto";
import type { KpiSummaryDto } from "../dto/kpi-summary.dto";
import { toCampaigns } from "../transformers/ad-accounts.transformer";
import type { Campaign } from "../types/ad-accounts.types";
import { listFilterQuery, pagedListQuery, windowQuery } from "./list-query";
import type { ListFilters } from "./list-query";

export function useCampaigns(
  accountId: string | null,
  range: DateRange,
  rangeExplicit: boolean,
  filters: ListFilters,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "campaigns", range.from, range.to, rangeExplicit, filters, page, pageSize],
    enabled: accountId !== null,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ListPage<Campaign>> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).campaigns.get({
        query: pagedListQuery(range, rangeExplicit, filters, undefined, page, pageSize),
      });
      if (error) throw new Error("Failed to load campaigns");
      const payload = body as { data: CampaignDto[]; meta?: { total?: number } };
      return { items: toCampaigns(payload.data), total: payload.meta?.total ?? 0 };
    },
  });
}

export function useCampaignsSummary(
  accountId: string | null,
  range: DateRange,
  rangeExplicit: boolean,
  filters: ListFilters,
) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "campaigns", "summary", range.from, range.to, rangeExplicit, filters],
    enabled: accountId !== null,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<KpiSummary> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).campaigns.summary.get({
        query: { ...windowQuery(range, rangeExplicit), ...listFilterQuery(filters) },
      });
      if (error) throw new Error("Failed to load campaign totals");
      return (body as { data: KpiSummaryDto }).data;
    },
  });
}
