import { useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { inlineErrorCopy } from "../services/api-call-error";
import {
  useAcknowledgeAlert,
  useCreateTaskFromAlert,
  useDismissAlert,
  useSnoozeAlert,
} from "../services/alerts.service";
import type { Alert } from "../types/alerts.types";
import { SeverityChip } from "./SeverityChip";
import { StatChips } from "./StatChips";

function formatSnoozedUntil(value: Date): string {
  return value.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertCard({ alert }: { alert: Alert }) {
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const acknowledge = useAcknowledgeAlert();
  const snooze = useSnoozeAlert();
  const dismiss = useDismissAlert();
  const createTask = useCreateTaskFromAlert();

  const onMutate = () => setError(null);
  const onError = (mutationError: unknown) => setError(inlineErrorCopy(mutationError));
  const pending = acknowledge.isPending || snooze.isPending || dismiss.isPending || createTask.isPending;
  const showActions = alert.status !== "suppressed" && alert.status !== "dismissed";
  const metrics = Object.entries(alert.supportingMetrics).map(([label, value]) => ({
    label,
    value: String(value),
  }));

  return (
    <section className="flex flex-col gap-3 rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <SeverityChip severity={alert.severity} />
          <span className="font-mono text-xs tabular-nums text-volt-text-3">
            {formatRelativeTime(alert.detectedAt)}
          </span>
        </div>
        <p className="text-sm font-semibold text-volt-text">{alert.whatHappened}</p>
        <p className="text-[13px] text-volt-text-2">{alert.whyItMatters}</p>
        <p className="text-[13px] text-volt-text-2">
          <span className="text-volt-text-3">Recommended: </span>
          {alert.recommendedAction}
        </p>
        <p className="text-xs text-volt-text-3">
          {alert.clientName} · {alert.entityName}
        </p>
      </div>
      {metrics.length > 0 ? <StatChips items={metrics} /> : null}
      {alert.status === "suppressed" ? <p className="text-xs text-volt-text-3">Suppressed — task open</p> : null}
      {alert.status === "dismissed" ? (
        <p className="text-xs text-volt-text-3">Dismissed — {alert.dismissedReason ?? "no reason given"}</p>
      ) : null}
      {alert.status === "snoozed" && alert.snoozedUntil ? (
        <p className="text-xs text-volt-text-3">Snoozed until {formatSnoozedUntil(alert.snoozedUntil)}</p>
      ) : null}
      {showActions ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={alert.status === "open" ? "primary" : "ghost"}
              disabled={pending}
              onClick={() => {
                onMutate();
                createTask.mutate(alert.id, { onError });
              }}
            >
              Create task
            </Button>
            {alert.status === "open" ? (
              <>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    onMutate();
                    acknowledge.mutate(alert.id, { onError });
                  }}
                >
                  Acknowledge
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    onMutate();
                    snooze.mutate({ id: alert.id, hours: 24 }, { onError });
                  }}
                >
                  Snooze 24h
                </Button>
              </>
            ) : null}
            <Button variant="ghost-danger" disabled={pending} onClick={() => setDismissing(true)}>
              Dismiss
            </Button>
          </div>
          {dismissing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-xs"
                placeholder="Reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <Button
                variant="ghost-danger"
                disabled={pending}
                onClick={() => {
                  onMutate();
                  setDismissing(false);
                  dismiss.mutate({ id: alert.id, reason: reason.trim() }, { onError });
                }}
              >
                Confirm dismiss
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDismissing(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-volt-down">{error}</p> : null}
    </section>
  );
}
