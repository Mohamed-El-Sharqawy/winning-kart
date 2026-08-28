import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/Button";
import type { Client } from "@/shared/types/clients.types";
import { OVERVIEW_QUERY_KEY } from "@/shared/services/overview.service";
import { errorCopy } from "../data/sync-copy.data";
import { useAdAccounts } from "../services/ad-accounts.service";
import { useBackfill, useEnqueueSync, useLatestSyncRun } from "../services/sync.service";
import type { AdAccount } from "../types/ad-accounts.types";
import { AccountsTable } from "./AccountsTable";
import { AddAccountWizard } from "./AddAccountWizard";
import { RateLimitBanner } from "./RateLimitBanner";
import { ReconnectModal } from "./ReconnectModal";
import { RemoveAccountModal } from "./RemoveAccountModal";
import { SkeletonRows } from "./SkeletonRows";
import { SyncStageList } from "./SyncStageList";

export function AccountsTab({ client }: { client: Client }) {
  const { data: accounts, isPending, isError } = useAdAccounts(client.id);
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [reconnectTarget, setReconnectTarget] = useState<AdAccount | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdAccount | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const list = accounts ?? [];
  const firstAccount = list[0] ?? null;
  const enqueue = useEnqueueSync();
  const backfill = useBackfill(firstAccount?.id ?? null, 12);
  const { data: run } = useLatestSyncRun(activeAccountId);
  const runActive = run?.status === "queued" || run?.status === "running";
  const backfilling = run?.progress?.kind === "backfill";

  useEffect(() => {
    if (run === undefined || run === null || runActive || activeAccountId === null) {
      return;
    }
    setActiveAccountId(null);
    void queryClient.invalidateQueries({ queryKey: ["ad-accounts"] });
    void queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY });
    if (run.status === "failed") {
      setSyncMessage(errorCopy(run.errorClass ?? "server_error"));
    }
  }, [run, runActive, activeAccountId, queryClient]);

  function handleSync(account: AdAccount) {
    setSyncMessage(null);
    setActiveAccountId(account.id);
    enqueue.mutate(account.id, {
      onError: (error: Error) => {
        setActiveAccountId(null);
        setSyncMessage(error.message);
      },
    });
  }

  function handleBackfill() {
    if (firstAccount === null) return;
    setSyncMessage(null);
    setActiveAccountId(firstAccount.id);
    backfill.mutate(undefined, {
      onError: (error: Error) => {
        setActiveAccountId(null);
        setSyncMessage(error.message);
      },
    });
  }

  const stages = run?.progress?.stages ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-volt-text">Ad accounts</h2>
        <div className="flex flex-wrap items-center gap-3">
          {firstAccount !== null ? (
            <>
              <Button variant="ghost" disabled={backfill.isPending} onClick={handleBackfill}>
                {backfill.isPending
                  ? "Starting…"
                  : `Load 12 months history${list.length > 1 ? ` — ${firstAccount.name}` : ""}`}
              </Button>
              <span className="text-xs text-volt-text-3">
                Runs in the background — first backfill can take a while.
              </span>
            </>
          ) : null}
          <Button onClick={() => setWizardOpen(true)}>Add ad account</Button>
        </div>
      </div>
      {isPending ? (
        <SkeletonRows rows={4} columns={7} />
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load ad accounts.</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-volt-text-3">
          No ad accounts yet — add the first one to start syncing Meta data.
        </p>
      ) : (
        <>
          {list.map((account) => (
            <RateLimitBanner key={account.id} accountId={account.id} />
          ))}
          <AccountsTable
            accounts={list}
            onSync={handleSync}
            onReconnect={setReconnectTarget}
            onRemove={setRemoveTarget}
            syncPendingId={activeAccountId}
          />
        </>
      )}
      {run !== null && run !== undefined && runActive ? (
        <div className="rounded-[10px] border border-volt-border bg-volt-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-volt-text">
              {backfilling
                ? "Loading history in the background…"
                : run.status === "queued"
                  ? "Sync queued…"
                  : "Syncing in the background…"}
            </span>
            {run.graphCalls !== null ? (
              <span className="tabular text-xs text-volt-text-3">{run.graphCalls} Meta calls</span>
            ) : null}
          </div>
          {backfilling ? (
            <p className="text-sm text-volt-text-2">
              Loading history… chunk{" "}
              <span className="tabular">
                {run.progress?.chunksDone ?? 0}/{run.progress?.chunksTotal ?? 0}
              </span>
            </p>
          ) : (
            <SyncStageList stages={stages} inFlight />
          )}
        </div>
      ) : null}
      {syncMessage ? <p className="text-sm text-volt-down">{syncMessage}</p> : null}
      {wizardOpen ? <AddAccountWizard clientId={client.id} onClose={() => setWizardOpen(false)} /> : null}
      {reconnectTarget ? (
        <ReconnectModal account={reconnectTarget} onClose={() => setReconnectTarget(null)} />
      ) : null}
      {removeTarget ? (
        <RemoveAccountModal account={removeTarget} onClose={() => setRemoveTarget(null)} />
      ) : null}
    </div>
  );
}
