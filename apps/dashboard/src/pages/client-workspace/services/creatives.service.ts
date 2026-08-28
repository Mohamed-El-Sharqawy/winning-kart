import { useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { DateRange } from "@/shared/components/DateRangeControl";
import type { CreativeDto, FatigueSummaryDto } from "../dto/creatives.dto";
import { toCreatives, toFatigueSummary } from "../transformers/creatives.transformer";
import type { Creative, FatigueSummary } from "../types/creatives.types";

export function useCreatives(accountId: string | null, range: DateRange, rangeExplicit: boolean) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "ads", range.from, range.to, rangeExplicit],
    enabled: accountId !== null,
    queryFn: async (): Promise<Creative[]> => {
      const query: Record<string, string | number> = rangeExplicit ? { from: range.from, to: range.to } : { days: 30 };
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).ads.get(
        { query },
      );
      if (error) throw new Error("Failed to load creatives");
      const payload = (body as { data: CreativeDto[] }).data;
      return toCreatives(payload);
    },
  });
}

export function useFatigueSummary(accountId: string | null, range: DateRange, rangeExplicit: boolean) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "fatigue-summary", range.from, range.to, rangeExplicit],
    enabled: accountId !== null,
    queryFn: async (): Promise<FatigueSummary> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string })[
        "fatigue-summary"
      ].get(rangeExplicit ? { query: { from: range.from, to: range.to } } : undefined);
      if (error) throw new Error("Failed to load fatigue summary");
      const payload = (body as { data: FatigueSummaryDto }).data;
      return toFatigueSummary(payload);
    },
  });
}
