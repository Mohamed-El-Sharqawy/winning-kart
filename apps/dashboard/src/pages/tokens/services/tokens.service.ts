import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreatePatResponseDto, PatDto, RevokePatResponseDto } from "../dto/tokens.dto";
import { toCreatedPat, toPats } from "../transformers/tokens.transformer";
import type { CreatedPat, Pat } from "../types/tokens.types";

export const PATS_QUERY_KEY = ["auth", "pats"] as const;

export function patsQueryOptions() {
  return queryOptions({
    queryKey: PATS_QUERY_KEY,
    queryFn: async (): Promise<Pat[]> => {
      const { data, error } = await api.auth.pats.get();
      if (error) throw new Error("Failed to load tokens");
      return toPats(data as unknown as PatDto[]);
    },
  });
}

export function usePats() {
  return useQuery(patsQueryOptions());
}

export function useCreatePat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }): Promise<CreatedPat> => {
      const { data, error } = await api.auth.pats.post(input);
      if (error) throw new Error("Failed to create token");
      return toCreatedPat(data as CreatePatResponseDto);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATS_QUERY_KEY });
    },
  });
}

export function useRevokePat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patId: string): Promise<RevokePatResponseDto> => {
      const { data, error } = await api.auth.pats({ id: patId }).revoke.post(null);
      if (error) throw new Error("Failed to revoke token");
      return data as RevokePatResponseDto;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATS_QUERY_KEY });
    },
  });
}
