import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { asErrorClass, looseApi } from "@/shared/lib/loose-api";
import { OVERVIEW_QUERY_KEY } from "@/shared/services/overview.service";
import { errorCopy } from "../data/sync-copy.data";
import {
  toAdAccount,
  toAdAccounts,
  toCampaigns,
  toSyncResult,
} from "../transformers/ad-accounts.transformer";
import type { AdAccount, Campaign, SyncResult } from "../types/ad-accounts.types";
import type { AdAccountDto, CampaignDto, OkResponseDto, SyncResponseDto } from "../dto/ad-accounts.dto";

export class ApiCallError extends Error {
  readonly errorClass: string | null;

  constructor(message: string, errorClass: string | null) {
    super(message);
    this.name = "ApiCallError";
    this.errorClass = errorClass;
  }
}

function callFailed(error: unknown, fallback: string): ApiCallError {
  const errorClass = asErrorClass(error);
  return new ApiCallError(errorClass ? errorCopy(errorClass) : fallback, errorClass);
}

function invalidateAdAccountData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["clients"] });
  void queryClient.invalidateQueries({ queryKey: ["ad-accounts"] });
  void queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY });
}

export function adAccountsQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: ["clients", clientId, "ad-accounts"],
    queryFn: async (): Promise<AdAccount[]> => {
      const { data, error } = await looseApi.clients({ clientId }).adAccounts.get();
      if (error) throw new Error("Failed to load ad accounts");
      return toAdAccounts(data as AdAccountDto[]);
    },
  });
}

export function useAdAccounts(clientId: string) {
  return useQuery(adAccountsQueryOptions(clientId));
}

export function useCampaigns(accountId: string | null, days: number) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "campaigns", days],
    enabled: accountId !== null,
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await looseApi
        .adAccounts({ id: accountId as string })
        .campaigns.get({ query: { days } });
      if (error) throw new Error("Failed to load campaigns");
      return toCampaigns(data as CampaignDto[]);
    },
  });
}

export interface CreateAdAccountInput {
  name: string;
  adAccountId: string;
  accessToken: string;
}

export function useCreateAdAccount(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAdAccountInput): Promise<AdAccount> => {
      const { data, error } = await looseApi.clients({ clientId }).adAccounts.post(input);
      if (error) throw callFailed(error, "Failed to add ad account");
      return toAdAccount(data as AdAccountDto);
    },
    onSuccess: () => invalidateAdAccountData(queryClient),
  });
}

export function useSyncAdAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string): Promise<SyncResult> => {
      const { data, error } = await looseApi.adAccounts({ id: accountId }).sync.post(null);
      if (error) throw callFailed(error, "Sync failed");
      return toSyncResult(data as SyncResponseDto);
    },
    onSettled: () => invalidateAdAccountData(queryClient),
  });
}

export function useReconnectAdAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; accessToken: string }): Promise<boolean> => {
      const { data, error } = await looseApi
        .adAccounts({ id: input.id })
        .reconnect.post({ accessToken: input.accessToken });
      if (error) throw callFailed(error, "Reconnect failed");
      return Boolean((data as OkResponseDto | null)?.ok);
    },
    onSuccess: () => invalidateAdAccountData(queryClient),
  });
}

export function useRemoveAdAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; confirmSlug: string }): Promise<boolean> => {
      const { data, error } = await looseApi
        .adAccounts({ id: input.id })
        .delete({ confirmSlug: input.confirmSlug });
      if (error) throw callFailed(error, "Failed to remove ad account");
      return Boolean((data as OkResponseDto | null)?.ok);
    },
    onSuccess: () => invalidateAdAccountData(queryClient),
  });
}
