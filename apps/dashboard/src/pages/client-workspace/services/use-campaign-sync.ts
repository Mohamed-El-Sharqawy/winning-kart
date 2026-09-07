import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { errorCopy } from "../data/sync-copy.data";
import { useEnqueueSync, useLatestSyncRun } from "./sync.service";

export function useCampaignSync(accountId: string | null) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [watchedAccountId, setWatchedAccountId] = useState<string | null>(null);
  const [syncRunId, setSyncRunId] = useState<string | null>(null);
  const enqueue = useEnqueueSync();
  const { data: run } = useLatestSyncRun(watchedAccountId);

  useEffect(() => {
    if (run === null || run === undefined || run.id !== syncRunId || watchedAccountId === null) {
      return;
    }
    if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
      void queryClient.invalidateQueries({ queryKey: ["ad-accounts", watchedAccountId, "campaigns"] });
      if (run.status === "failed") {
        setMessage(errorCopy(run.errorClass ?? "server_error"));
      } else if (run.status === "succeeded") {
        setMessage(null);
      }
      setWatchedAccountId(null);
      setSyncRunId(null);
    }
  }, [run, syncRunId, watchedAccountId, queryClient]);

  function startSync() {
    if (accountId === null) return;
    setMessage(null);
    enqueue.mutate(accountId, {
      onSuccess: (runId) => {
        setWatchedAccountId(accountId);
        setSyncRunId(runId);
        setMessage("Sync queued — campaigns refresh when it finishes.");
      },
      onError: (error: Error) => setMessage(error.message),
    });
  }

  return { message, startSync, enqueue };
}
