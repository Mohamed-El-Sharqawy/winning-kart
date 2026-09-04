import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/Button";
import { DateRangeControl } from "@/shared/components/DateRangeControl";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { EmptyState } from "@/shared/components/EmptyState";
import type { Client } from "@/shared/types/clients.types";
import { errorCopy } from "../data/sync-copy.data";
import { useAdAccounts, useCampaigns } from "../services/ad-accounts.service";
import { useEnqueueSync, useLatestSyncRun } from "../services/sync.service";
import { CampaignsTable } from "./CampaignsTable";
import { SkeletonRows } from "./SkeletonRows";

const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

export interface CampaignsTabProps {
  client: Client;
  range: DateRange;
  rangeExplicit: boolean;
  onApplyRange: (range: DateRange | undefined) => void;
}

export function CampaignsTab({ client, range, rangeExplicit, onApplyRange }: CampaignsTabProps) {
  const { data: accounts, isPending: accountsPending } = useAdAccounts(client.id);
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [watchedAccountId, setWatchedAccountId] = useState<string | null>(null);
  const [syncRunId, setSyncRunId] = useState<string | null>(null);
  const enqueue = useEnqueueSync();
  const list = accounts ?? [];
  const selectedId = accountId ?? list[0]?.id ?? null;
  const { data: campaigns, isPending } = useCampaigns(selectedId, range, rangeExplicit);
  const { data: run } = useLatestSyncRun(watchedAccountId);

  useEffect(() => {
    if (run === null || run === undefined || run.id !== syncRunId || watchedAccountId === null) {
      return;
    }
    if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
      void queryClient.invalidateQueries({ queryKey: ["ad-accounts", watchedAccountId, "campaigns"] });
      if (run.status === "failed") {
        setSyncMessage(errorCopy(run.errorClass ?? "server_error"));
      } else if (run.status === "succeeded") {
        setSyncMessage(null);
      }
      setWatchedAccountId(null);
      setSyncRunId(null);
    }
  }, [run, syncRunId, watchedAccountId, queryClient]);

  function handleSync() {
    if (selectedId === null) return;
    setSyncMessage(null);
    const target = selectedId;
    enqueue.mutate(target, {
      onSuccess: (runId) => {
        setWatchedAccountId(target);
        setSyncRunId(runId);
        setSyncMessage("Sync queued — campaigns refresh when it finishes.");
      },
      onError: (error: Error) => setSyncMessage(error.message),
    });
  }

  if (accountsPending) {
    return <p className="text-sm text-volt-text-3">Loading ad accounts…</p>;
  }
  if (list.length === 0) {
    return (
      <EmptyState
        title="No ad accounts yet"
        hint="Add an ad account on the Ad Accounts tab, then sync it to pull campaigns."
      />
    );
  }

  const rows = campaigns ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Ad account
          <select
            value={selectedId ?? ""}
            onChange={(event) => setAccountId(event.target.value)}
            className={SELECT_CLASS}
          >
            {list.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <DateRangeControl
          from={rangeExplicit ? range.from : undefined}
          to={rangeExplicit ? range.to : undefined}
          onApply={onApplyRange}
        />
      </div>
      {isPending ? (
        <SkeletonRows rows={8} columns={9} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          hint="Sync the ad account to pull data."
          action={
            <Button variant="ghost" disabled={enqueue.isPending} onClick={handleSync}>
              {enqueue.isPending ? "Starting…" : "Sync now"}
            </Button>
          }
        />
      ) : (
        <CampaignsTable campaigns={rows} />
      )}
      {syncMessage ? <p className="text-sm text-volt-down">{syncMessage}</p> : null}
    </div>
  );
}
