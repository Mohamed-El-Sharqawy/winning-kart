import { useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";

export const BELL_QUERY_KEY = ["bell"] as const;

interface BellDto {
  count: number;
}

export function useBellCount() {
  return useQuery({
    queryKey: BELL_QUERY_KEY,
    refetchInterval: 60000,
    queryFn: async (): Promise<number> => {
      const { data: body, error } = await looseApi.alerts.bell.get();
      if (error) throw new Error("Failed to load alert count");
      return (body as { data: BellDto | null }).data?.count ?? 0;
    },
  });
}
