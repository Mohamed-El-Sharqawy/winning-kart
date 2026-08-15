import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { errorCopy } from "../data/sync-copy.data";
import { useCreateAdAccount, useSyncAdAccount } from "../services/ad-accounts.service";
import type { SyncResult } from "../types/ad-accounts.types";
import { Modal } from "./Modal";
import { SyncStageList } from "./SyncStageList";
import { TokenField } from "./TokenField";

type WizardPhase =
  | { kind: "form" }
  | { kind: "creating" }
  | { kind: "syncing" }
  | { kind: "failed"; result: SyncResult; accountId: string };

function failedErrorClass(result: SyncResult): string | null {
  if (result.errorClass) return result.errorClass;
  return result.stages.find((stage) => stage.status === "failed")?.errorClass ?? null;
}

export function AddAccountWizard({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phase, setPhase] = useState<WizardPhase>({ kind: "form" });
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateAdAccount(clientId);
  const sync = useSyncAdAccount();

  async function runSync(accountId: string) {
    try {
      setPhase({ kind: "syncing" });
      const result = await sync.mutateAsync(accountId);
      if (result.ok) {
        onClose();
        return;
      }
      setPhase({ kind: "failed", result, accountId });
    } catch {
      setPhase({ kind: "failed", result: { ok: false, stages: [] }, accountId });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      setPhase({ kind: "creating" });
      const account = await create.mutateAsync({ name, adAccountId, accessToken });
      await runSync(account.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to add ad account");
      setPhase({ kind: "form" });
    }
  }

  async function handleRetrySync() {
    if (phase.kind !== "failed") return;
    await runSync(phase.accountId);
  }

  const inForm = phase.kind === "form" || phase.kind === "creating";
  const busy = phase.kind === "creating" || phase.kind === "syncing";

  return (
    <Modal title="Add ad account" onClose={busy ? () => undefined : onClose}>
      {inForm ? (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <p className="text-[13px] leading-relaxed text-volt-text-2">
            System-user token path: create a Meta system user with the ads_read and ads_management
            scopes on the ad account, then paste its access token here.
          </p>
          <Input
            label="Name"
            value={name}
            required
            disabled={phase.kind === "creating"}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Ad account ID"
            placeholder="act_123456789"
            value={adAccountId}
            required
            disabled={phase.kind === "creating"}
            onChange={(event) => setAdAccountId(event.target.value)}
          />
          <label htmlFor="wizard-token" className="flex flex-col gap-1.5 text-[13px] text-volt-text-2">
            Access token
            <TokenField id="wizard-token" value={accessToken} onChange={setAccessToken} disabled={phase.kind === "creating"} />
          </label>
          {formError ? <p className="text-sm text-volt-down">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={phase.kind === "creating"}>
              Cancel
            </Button>
            <Button type="submit" disabled={phase.kind === "creating"}>
              {phase.kind === "creating" ? "Creating…" : "Add and sync"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <SyncStageList
            result={phase.kind === "failed" ? phase.result : null}
            inFlight={phase.kind === "syncing"}
          />
          {phase.kind === "failed" ? (
            <>
              <p className="text-sm text-volt-down">{errorCopy(failedErrorClass(phase.result))}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => void handleRetrySync()}>Retry sync</Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
