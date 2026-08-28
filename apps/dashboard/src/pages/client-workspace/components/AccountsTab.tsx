import { useState } from "react";
import { Button } from "@/shared/components/Button";
import type { Client } from "@/shared/types/clients.types";
import { errorCopy } from "../data/sync-copy.data";
import { useAdAccounts, useSyncAdAccount } from "../services/ad-accounts.service";
import type { AdAccount } from "../types/ad-accounts.types";
import { AccountsTable } from "./AccountsTable";
import { AddAccountWizard } from "./AddAccountWizard";
import { RateLimitBanner } from "./RateLimitBanner";
import { ReconnectModal } from "./ReconnectModal";
import { RemoveAccountModal } from "./RemoveAccountModal";
import { SkeletonRows } from "./SkeletonRows";

export function AccountsTab({ client }: { client: Client }) {
  const { data: accounts, isPending, isError } = useAdAccounts(client.id);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [reconnectTarget, setReconnectTarget] = useState<AdAccount | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdAccount | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const sync = useSyncAdAccount();

  function handleSync(account: AdAccount) {
    setSyncMessage(null);
    sync.mutate(account.id, {
      onSuccess: (result) => {
        if (!result.ok) {
          setSyncMessage(
            errorCopy(result.errorClass ?? result.stages.find((stage) => stage.status === "failed")?.errorClass),
          );
        }
      },
      onError: (error: Error) => setSyncMessage(error.message),
    });
  }

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
            syncPendingId={sync.isPending ? (sync.variables ?? null) : null}
          />
        </>
      )}
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
