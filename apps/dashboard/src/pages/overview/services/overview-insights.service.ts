import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { OverviewInsightDto } from "../dto/overview-insights.dto";
import { toOverviewInsights } from "../transformers/overview-insights.transformer";
import type { OverviewInsight } from "../types/overview-insights.types";

export const OVERVIEW_INSIGHTS_QUERY_KEY = ["overview-insights"] as const;

export function overviewInsightsQueryOptions() {
  return queryOptions({
    queryKey: OVERVIEW_INSIGHTS_QUERY_KEY,
    queryFn: async (): Promise<OverviewInsight[]> => {
      const { data: body, error } = await looseApi.overview.get();
      if (error) throw new Error("Failed to load insights");
      const payload = (body as { data: { insights?: OverviewInsightDto[] } }).data;
      return toOverviewInsights(payload.insights ?? []);
    },
  });
}

export function useOverviewInsights() {
  return useQuery(overviewInsightsQueryOptions());
}
