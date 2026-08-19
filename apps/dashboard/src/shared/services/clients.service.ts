import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { asErrorClass, looseApi } from "@/shared/lib/loose-api";
import { OVERVIEW_QUERY_KEY } from "@/shared/services/overview.service";
import type { ClientDto } from "../dto/clients.dto";
import { toClient, toClients } from "../transformers/clients.transformer";
import type { Client, ClientStatus } from "../types/clients.types";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

export class ClientApiError extends Error {
  readonly errorClass: string | null;

  constructor(fallback: string, errorClass: string | null) {
    super(fallback);
    this.name = "ClientApiError";
    this.errorClass = errorClass;
  }
}

function callFailed(error: unknown, fallback: string): ClientApiError {
  return new ClientApiError(fallback, asErrorClass(error));
}

interface LoosePatch {
  patch(body: unknown): Promise<{ data: unknown; error: unknown }>;
}

function clientEndpoint(id: string): LoosePatch {
  return looseApi.clients({ id }) as unknown as LoosePatch;
}

export function clientsQueryOptions() {
  return queryOptions({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async (): Promise<Client[]> => {
      const { data: body, error } = await api.clients.get();
      if (error) throw new Error("Failed to load clients");
      const payload = (body as unknown as { data: ClientDto[] }).data;
      return toClients(payload);
    },
  });
}

export function useClients() {
  return useQuery(clientsQueryOptions());
}

export interface CreateClientInput {
  name: string;
  slug: string;
  industry?: string;
  displayCurrency?: string;
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClientInput): Promise<Client> => {
      const { data: body, error } = await looseApi.clients.post(input);
      if (error) throw callFailed(error, "Failed to create client");
      return toClient((body as { data: ClientDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export interface UpdateClientInput {
  id: string;
  name?: string;
  slug?: string;
  industry?: string | null;
  status?: ClientStatus;
  displayCurrency?: string;
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateClientInput): Promise<Client> => {
      const { id, ...changes } = input;
      const { data: body, error } = await clientEndpoint(id).patch(changes);
      if (error) throw callFailed(error, "Failed to save changes");
      return toClient((body as { data: ClientDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export interface DeleteClientInput {
  id: string;
  confirmSlug: string;
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeleteClientInput): Promise<boolean> => {
      const { data: body, error } = await looseApi
        .clients({ id: input.id })
        .delete({ confirmSlug: input.confirmSlug });
      if (error) throw callFailed(error, "Failed to delete client");
      return Boolean((body as { data: { ok?: boolean } | null }).data?.ok);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY });
    },
  });
}
