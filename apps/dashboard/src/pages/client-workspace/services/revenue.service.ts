import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { asErrorClass, looseApi } from "@/shared/lib/loose-api";
import { ApiCallError } from "./ad-accounts.service";
import type {
  CreateRevenueSourceResponseDto,
  RevenueSnapshotDto,
  RevenueSourceDto,
} from "../dto/revenue.dto";
import {
  toCreatedRevenueSource,
  toRevenueSnapshot,
  toRevenueSources,
} from "../transformers/revenue.transformer";
import type { CreatedRevenueSource, RevenueSnapshot, RevenueSource } from "../types/revenue.types";

const REVENUE_DAYS = 30;

function fail(error: unknown, fallback: string): ApiCallError {
  return new ApiCallError(fallback, asErrorClass(error));
}

export function revenueQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: ["clients", clientId, "revenue", REVENUE_DAYS],
    queryFn: async (): Promise<RevenueSnapshot> => {
      const { data: body, error } = await looseApi
        .clients({ clientId })
        .revenue.get({ query: { days: REVENUE_DAYS } });
      if (error) throw new Error("Failed to load revenue");
      return toRevenueSnapshot((body as { data: RevenueSnapshotDto }).data);
    },
  });
}

export function useRevenueSnapshot(clientId: string) {
  return useQuery(revenueQueryOptions(clientId));
}

export function revenueSourcesQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: ["clients", clientId, "revenue-sources"],
    queryFn: async (): Promise<RevenueSource[]> => {
      const { data: body, error } = await looseApi.clients({ clientId })["revenue-sources"].get();
      if (error) throw new Error("Failed to load revenue sources");
      return toRevenueSources((body as { data: RevenueSourceDto[] }).data);
    },
  });
}

export function useRevenueSources(clientId: string) {
  return useQuery(revenueSourcesQueryOptions(clientId));
}

export function useCreateRevenueSource(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<CreatedRevenueSource> => {
      const { data: body, error } = await looseApi
        .clients({ clientId })
        ["revenue-sources"].post({ name });
      if (error) throw fail(error, "Failed to create revenue source");
      return toCreatedRevenueSource((body as { data: CreateRevenueSourceResponseDto }).data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId, "revenue-sources"] });
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId, "revenue"] });
    },
  });
}

export function useRevokeRevenueSource(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; confirmName: string }): Promise<boolean> => {
      const { data: body, error } = await looseApi
        .clients({ clientId })
        ["revenue-sources"]({ id: input.id })
        .delete({ confirmName: input.confirmName });
      if (error) throw fail(error, "Failed to revoke revenue source");
      return Boolean((body as { data: { ok: boolean } | null }).data?.ok);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId, "revenue-sources"] });
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId, "revenue"] });
    },
  });
}
