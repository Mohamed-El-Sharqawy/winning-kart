import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ClientDto } from "../dto/clients.dto";
import { toClients } from "../transformers/clients.transformer";
import type { Client } from "../types/clients.types";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

export function clientsQueryOptions() {
  return queryOptions({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await api.clients.get();
      if (error) throw new Error("Failed to load clients");
      return toClients(data as unknown as ClientDto[]);
    },
  });
}

export function useClients() {
  return useQuery(clientsQueryOptions());
}
