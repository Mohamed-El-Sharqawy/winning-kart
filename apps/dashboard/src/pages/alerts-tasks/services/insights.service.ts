import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { callFailed } from "./api-call-error";
import { toInsights } from "../transformers/insights.transformer";
import { toTask } from "../transformers/tasks.transformer";
import type { Insight } from "../types/insights.types";
import type { InsightDto } from "../dto/insights.dto";
import type { OkDto } from "../dto/alerts.dto";
import type { TaskDto } from "../dto/tasks.dto";

export function insightsQueryOptions() {
  return queryOptions({
    queryKey: ["insights"],
    queryFn: async (): Promise<Insight[]> => {
      const { data: body, error } = await looseApi.insights.get();
      if (error) throw new Error("Failed to load insights");
      return toInsights((body as { data: InsightDto[] }).data);
    },
  });
}

export function useInsights() {
  return useQuery(insightsQueryOptions());
}

export function useAcceptInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: body, error } = await looseApi.insights({ id }).accept.post(null);
      if (error) throw callFailed(error, "Failed to accept recommendation");
      return toTask((body as { data: TaskDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["insights"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useMarkNotUseful() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const { data: body, error } = await looseApi.insights({ id })["not-useful"].post(null);
      if (error) throw callFailed(error, "Failed to mark recommendation");
      return Boolean((body as { data: OkDto | null }).data?.ok);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
