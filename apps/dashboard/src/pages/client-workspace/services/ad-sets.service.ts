import { useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { DateRange } from "@/shared/components/DateRangeControl";
import type { AdSetDto } from "../dto/ad-sets.dto";
import { toAdSets } from "../transformers/ad-sets.transformer";
import type { AdSet } from "../types/ad-sets.types";

export function useAdSets(accountId: string | null, range: DateRange, rangeExplicit: boolean) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "ad-sets", range.from, range.to, rangeExplicit],
    enabled: accountId !== null,
    queryFn: async (): Promise<AdSet[]> => {
      const query: Record<string, string | number> = rangeExplicit ? { from: range.from, to: range.to } : { days: 30 };
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string })[
        "ad-sets"
      ].get({ query });
      if (error) throw new Error("Failed to load ad sets");
      const payload = (body as { data: AdSetDto[] }).data;
      return toAdSets(payload);
    },
  });
}
