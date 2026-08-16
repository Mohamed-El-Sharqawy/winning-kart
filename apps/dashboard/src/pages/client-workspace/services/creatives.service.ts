import { useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { CreativeDto, FatigueSummaryDto } from "../dto/creatives.dto";
import { toCreatives, toFatigueSummary } from "../transformers/creatives.transformer";
import type { Creative, FatigueSummary } from "../types/creatives.types";

export function useCreatives(accountId: string | null, days: number) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "ads", days],
    enabled: accountId !== null,
    queryFn: async (): Promise<Creative[]> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).ads.get(
        { query: { days } },
      );
      if (error) throw new Error("Failed to load creatives");
      const payload = (body as { data: CreativeDto[] }).data;
      return toCreatives(payload);
    },
  });
}

export function useFatigueSummary(accountId: string | null, days: number) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "fatigue-summary", days],
    enabled: accountId !== null,
    queryFn: async (): Promise<FatigueSummary> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string })[
        "fatigue-summary"
      ].get();
      if (error) throw new Error("Failed to load fatigue summary");
      const payload = (body as { data: FatigueSummaryDto }).data;
      return toFatigueSummary(payload);
    },
  });
}
