import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/Button";
import type { Client } from "@/shared/types/clients.types";
import { OVERVIEW_QUERY_KEY } from "@/shared/services/overview.service";
import { errorCopy } from "../data/sync-copy.data";
import {
  useAdAccounts,
  useEnqueueSync,
  useLatestSyncRun,
} from "../services/ad-accounts.service";
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
  const enqueue = useEnqueueSync();
  const { data: run } = useLatestSyncRun(activeAccountId);
  const runActive = run?.status === "queued" || run?.status === "running";

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

  const stages = run?.progress?.stages ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-volt-text">Ad accounts</h2>
        <Button onClick={() => setWizardOpen(true)}>Add ad account</Button>
      </div>
      {isPending ? (
        <SkeletonRows rows={4} columns={7} />
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load ad accounts.</p>
      ) : (accounts ?? []).length === 0 ? (
        <p className="text-sm text-volt-text-3">
          No ad accounts yet — add the first one to start syncing Meta data.
        </p>
      ) : (
        <>
          {(accounts ?? []).map((account) => (
            <RateLimitBanner key={account.id} accountId={account.id} />
          ))}
          <AccountsTable
            accounts={accounts ?? []}
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
              {run.status === "queued" ? "Sync queued…" : "Syncing in the background…"}
            </span>
            {run.graphCalls !== null ? (
              <span className="tabular text-xs text-volt-text-3">{run.graphCalls} Meta calls</span>
            ) : null}
          </div>
          <SyncStageList stages={stages} inFlight />
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
