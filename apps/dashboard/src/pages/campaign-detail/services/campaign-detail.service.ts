import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { CampaignDetailResponseDto } from "../dto/campaign-detail.dto";
import { toCampaignDetail } from "../transformers/campaign-detail.transformer";
import type { CampaignDetail } from "../types/campaign-detail.types";

export function campaignDetailQueryOptions(accountId: string, campaignId: string, days: number) {
  return queryOptions({
    queryKey: ["ad-accounts", accountId, "campaigns", campaignId, days],
    queryFn: async (): Promise<CampaignDetail> => {
      const { data: body, error } = await looseApi
        ["ad-accounts"]({ id: accountId })
        .campaigns({ campaignId })
        .get({ query: { days } });
      if (error) throw new Error("Failed to load campaign");
      const payload = (body as { data: CampaignDetailResponseDto }).data;
      return toCampaignDetail(payload);
    },
  });
}

export function useCampaignDetail(accountId: string | null, campaignId: string, days: number) {
  return useQuery({
    ...campaignDetailQueryOptions(accountId ?? "", campaignId, days),
    enabled: accountId !== null,
  });
}
