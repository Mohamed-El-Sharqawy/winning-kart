import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { callFailed, invalidateAdAccountData } from "./ad-accounts.service";
import type { SyncRun } from "../types/ad-accounts.types";

export function useEnqueueSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string): Promise<string> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId }).sync.post(null);
      if (error) throw callFailed(error, "Sync failed to start");
      const payload = (body as { data: { runId: string } }).data;
      return payload.runId;
    },
    onSettled: () => invalidateAdAccountData(queryClient),
  });
}

export function useBackfill(accountId: string | null, months: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).backfill.post({
        months,
      });
      if (error) throw callFailed(error, "History backfill failed to start");
      const payload = (body as { data: { runId: string } }).data;
      return payload.runId;
    },
    onSettled: () => invalidateAdAccountData(queryClient),
  });
}

export function useLatestSyncRun(accountId: string | null) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "sync-run"],
    enabled: accountId !== null,
    queryFn: async (): Promise<SyncRun | null> => {
      const { data: body } = await looseApi["ad-accounts"]({ id: accountId as string }).sync.runs.latest.get();
      return ((body as { data: SyncRun | null }).data) ?? null;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 3000 : false;
    },
  });
}
