import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { OverviewDto } from "../dto/overview.dto";
import { toOverview } from "../transformers/overview.transformer";
import type { Overview } from "../types/overview.types";

export const OVERVIEW_QUERY_KEY = ["overview"] as const;

export interface OverviewRange {
  from: string;
  to: string;
}

export function overviewQueryOptions(range?: OverviewRange) {
  return queryOptions({
    queryKey: [...OVERVIEW_QUERY_KEY, range?.from ?? null, range?.to ?? null],
    queryFn: async (): Promise<Overview> => {
      const { data: body, error } = await looseApi.overview.get({
        query: range !== undefined ? { from: range.from, to: range.to } : undefined,
      });
      if (error) throw new Error("Failed to load overview");
      const payload = (body as { data: OverviewDto }).data;
      return toOverview(payload);
    },
  });
}

export function useOverview(range?: OverviewRange) {
  return useQuery(overviewQueryOptions(range));
}
