import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { useClients } from "@/shared/services/clients.service";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { adAccountsQueryOptions } from "@/pages/client-workspace/services/ad-accounts.service";
import type { CampaignDetailResponseDto } from "../dto/campaign-detail.dto";
import { toCampaignDetail } from "../transformers/campaign-detail.transformer";
import type { CampaignDetail } from "../types/campaign-detail.types";

export function campaignDetailQueryOptions(
  accountId: string,
  campaignId: string,
  days: number,
  explicitRange: DateRange | null,
) {
  return queryOptions({
    queryKey: [
      "ad-accounts",
      accountId,
      "campaigns",
      campaignId,
      days,
      explicitRange?.from ?? null,
      explicitRange?.to ?? null,
    ],
    queryFn: async (): Promise<CampaignDetail> => {
      const query: Record<string, string | number> = explicitRange
        ? { from: explicitRange.from, to: explicitRange.to }
        : { days };
      const { data: body, error } = await looseApi
        ["ad-accounts"]({ id: accountId })
        .campaigns({ campaignId })
        .get({ query });
      if (error) throw new Error("Failed to load campaign");
      const payload = (body as { data: CampaignDetailResponseDto }).data;
      return toCampaignDetail(payload);
    },
  });
}

export function useCampaignDetail(
  accountId: string | null,
  campaignId: string,
  days: number,
  explicitRange: DateRange | null,
) {
  return useQuery({
    ...campaignDetailQueryOptions(accountId ?? "", campaignId, days, explicitRange),
    enabled: accountId !== null,
  });
}

export interface CampaignAccountResolution {
  accountId: string | null;
  accountName: string | null;
  resolved: boolean;
}

const PENDING_RESOLUTION: CampaignAccountResolution = { accountId: null, accountName: null, resolved: false };

export function useCampaignAccountResolution(
  slug: string,
  campaignId: string,
  enabled: boolean,
): CampaignAccountResolution {
  const { data: clients, isPending: clientsPending } = useClients();
  const client = clients?.find((candidate) => candidate.slug === slug) ?? null;
  const accountsQuery = useQuery({
    ...adAccountsQueryOptions(client?.id ?? ""),
    enabled: enabled && client !== null,
  });
  const accounts = accountsQuery.data ?? [];
  const single = accounts.length === 1 ? accounts[0] : null;
  const ownerQuery = useQuery({
    queryKey: ["clients", client?.id ?? "", "campaign-owner", campaignId],
    enabled: enabled && single === null && accounts.length > 1,
    queryFn: async (): Promise<{ id: string; name: string } | null> => {
      for (const account of accounts) {
        const { data: body, error } = await looseApi["ad-accounts"]({ id: account.id }).campaigns.get({
          query: { days: 30 },
        });
        if (error) continue;
        const owned = (body as { data: Array<{ id: string }> }).data.some((row) => row.id === campaignId);
        if (owned) return { id: account.id, name: account.name };
      }
      return null;
    },
  });
  if (!enabled) return { accountId: null, accountName: null, resolved: true };
  if (clientsPending || (client !== null && accountsQuery.isPending)) return PENDING_RESOLUTION;
  if (single !== null) return { accountId: single.id, accountName: single.name, resolved: true };
  if (ownerQuery.isPending) return PENDING_RESOLUTION;
  const owner = ownerQuery.data ?? null;
  return { accountId: owner?.id ?? null, accountName: owner?.name ?? null, resolved: true };
}
