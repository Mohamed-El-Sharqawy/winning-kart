import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { errorCopy } from "../data/sync-copy.data";
import { useCreateAdAccount } from "../services/ad-accounts.service";
import { useEnqueueSync, useLatestSyncRun } from "../services/sync.service";
import type { SyncResult, TokenType } from "../types/ad-accounts.types";
import { Modal } from "./Modal";
import { SyncStageList } from "./SyncStageList";
import { TokenField } from "./TokenField";

const TOKEN_TYPE_OPTIONS: Array<{ value: TokenType; label: string; helper: string }> = [
  {
    value: "system_user",
    label: "System user token — permanent, recommended",
    helper:
      "No expiry. Create it in Meta Business Settings with ads_read, ads_management, business_management, read_insights, pages_read_engagement, catalogs_read.",
  },
  {
    value: "user_60d",
    label: "User token — expires in 60 days",
    helper: "Meta expires this token in 60 days. You'll get a warning 7 days before it lapses.",
  },
];

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
  const [tokenType, setTokenType] = useState<TokenType>("system_user");
  const [phase, setPhase] = useState<WizardPhase>({ kind: "form" });
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateAdAccount(clientId);
  const enqueue = useEnqueueSync();
  const [syncRunId, setSyncRunId] = useState<string | null>(null);
  const [syncAccountId, setSyncAccountId] = useState<string | null>(null);
  const { data: run } = useLatestSyncRun(syncAccountId);

  useEffect(() => {
    if (run === null || run === undefined || run.id !== syncRunId) {
      return;
    }
    if (run.status === "succeeded") {
      onClose();
      return;
    }
    if (run.status === "failed") {
      const stages = run.progress?.stages ?? [];
      setPhase({
        kind: "failed",
        result: {
          ok: false,
          stages: stages.map((stage) => ({
            stage: stage.stage,
            status: stage.status as "succeeded" | "failed",
            errorClass: stage.errorClass,
          })),
        },
        accountId: syncAccountId ?? "",
      });
    }
  }, [run, syncRunId, syncAccountId, onClose]);

  async function runSync(accountId: string) {
    setPhase({ kind: "syncing" });
    setSyncAccountId(accountId);
    try {
      const runId = await enqueue.mutateAsync(accountId);
      setSyncRunId(runId);
    } catch {
      setPhase({ kind: "failed", result: { ok: false, stages: [] }, accountId });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      setPhase({ kind: "creating" });
      const account = await create.mutateAsync({ name, adAccountId, accessToken, tokenType });
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
          <label htmlFor="wizard-token-type" className="flex flex-col gap-1.5 text-[13px] text-volt-text-2">
            Token type
            <select
              id="wizard-token-type"
              value={tokenType}
              disabled={phase.kind === "creating"}
              onChange={(event) => setTokenType(event.target.value as TokenType)}
              className="w-full rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none"
            >
              {TOKEN_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[13px] leading-relaxed text-volt-text-3">
            {TOKEN_TYPE_OPTIONS.find((option) => option.value === tokenType)?.helper}
          </p>
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
            stages={phase.kind === "failed" ? phase.result.stages : null}
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
          ) : (
            <p className="text-[13px] text-volt-text-3">
              The sync runs in the background — this window updates when it finishes.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
