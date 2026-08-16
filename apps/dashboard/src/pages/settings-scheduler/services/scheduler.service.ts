import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi, asErrorClass } from "@/shared/lib/loose-api";
import type { SchedulerJobDto, SchedulerStatusDto } from "../dto/scheduler.dto";
import { toSchedulerJobs, toSchedulerStatus } from "../transformers/scheduler.transformer";
import type { SchedulerJob, SchedulerJobFilters, SchedulerStatus } from "../types/scheduler.types";

export const SCHEDULER_STATUS_QUERY_KEY = ["scheduler", "status"] as const;

function schedulerError(scope: string, error: unknown): Error {
  const errorClass = asErrorClass(error);
  return new Error(errorClass ? `${scope} (${errorClass})` : scope);
}

export function schedulerStatusQueryOptions() {
  return queryOptions({
    queryKey: SCHEDULER_STATUS_QUERY_KEY,
    queryFn: async (): Promise<SchedulerStatus> => {
      const { data: body, error } = await looseApi.scheduler.status.get();
      if (error) throw schedulerError("Failed to load scheduler status", error);
      return toSchedulerStatus((body as { data: SchedulerStatusDto }).data);
    },
  });
}

export function useSchedulerStatus() {
  return useQuery(schedulerStatusQueryOptions());
}

export function schedulerJobsQueryOptions(filters: SchedulerJobFilters) {
  return queryOptions({
    queryKey: ["scheduler", "jobs", filters] as const,
    queryFn: async (): Promise<SchedulerJob[]> => {
      const query: Record<string, string | number> = { hours: filters.hours };
      if (filters.adAccountId !== "") query.adAccountId = filters.adAccountId;
      if (filters.status !== "") query.status = filters.status;
      const { data: body, error } = await looseApi.scheduler.jobs.get({ query });
      if (error) throw schedulerError("Failed to load scheduler jobs", error);
      return toSchedulerJobs((body as { data: SchedulerJobDto[] }).data);
    },
  });
}

export function useSchedulerJobs(filters: SchedulerJobFilters) {
  return useQuery(schedulerJobsQueryOptions(filters));
}
