import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { OverviewDto } from "../dto/overview.dto";
import { toOverview } from "../transformers/overview.transformer";
import type { Overview } from "../types/overview.types";

export const OVERVIEW_QUERY_KEY = ["overview"] as const;

export function overviewQueryOptions() {
  return queryOptions({
    queryKey: OVERVIEW_QUERY_KEY,
    queryFn: async (): Promise<Overview> => {
      const { data, error } = await looseApi.overview.get();
      if (error) throw new Error("Failed to load overview");
      return toOverview(data as OverviewDto);
    },
  });
}

export function useOverview() {
  return useQuery(overviewQueryOptions());
}
