import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { ApplyRetentionResponseDto, RetentionSettingsDto } from "../dto/retention.dto";

export const RETENTION_QUERY_KEY = ["retention"] as const;

interface LooseResult {
  data: unknown;
  error: unknown;
}

interface RetentionApi {
  get(): Promise<LooseResult>;
  put(body: unknown): Promise<LooseResult>;
  apply: { post(body: unknown): Promise<LooseResult> };
}

const retentionApi = looseApi.settings.retention as unknown as RetentionApi;

export function retentionQueryOptions() {
  return queryOptions({
    queryKey: RETENTION_QUERY_KEY,
    queryFn: async (): Promise<RetentionSettingsDto> => {
      const { data: body, error } = await retentionApi.get();
      if (error) throw new Error("Failed to load retention settings");
      return (body as { data: RetentionSettingsDto }).data;
    },
  });
}

export function useRetentionSettings() {
  return useQuery(retentionQueryOptions());
}

export function useSaveRetentionSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rawInsightsDays: number): Promise<RetentionSettingsDto> => {
      const { data: body, error } = await retentionApi.put({ rawInsightsDays });
      if (error) throw new Error("Failed to save retention settings");
      return (body as { data: RetentionSettingsDto }).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RETENTION_QUERY_KEY });
    },
  });
}

export function useApplyRetentionSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<ApplyRetentionResponseDto> => {
      const { data: body, error } = await retentionApi.apply.post(null);
      if (error) throw new Error("Failed to apply retention");
      return (body as { data: ApplyRetentionResponseDto }).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RETENTION_QUERY_KEY });
    },
  });
}
