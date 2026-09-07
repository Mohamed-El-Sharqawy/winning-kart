import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { toClient } from "@/shared/transformers/clients.transformer";
import type { ClientDto } from "@/shared/dto/clients.dto";
import type { Client } from "@/shared/types/clients.types";

export const PORTAL_CLIENT_QUERY_KEY = ["portal", "client"] as const;

export function portalClientQueryOptions() {
  return queryOptions({
    queryKey: PORTAL_CLIENT_QUERY_KEY,
    queryFn: async (): Promise<Client> => {
      const { data: body, error } = await looseApi.portal.client.get();
      if (error) throw new Error("Failed to load your business profile");
      const payload = (body as { data: ClientDto }).data;
      return toClient(payload);
    },
    staleTime: 60_000,
  });
}

export function usePortalClient() {
  return useQuery(portalClientQueryOptions());
}
