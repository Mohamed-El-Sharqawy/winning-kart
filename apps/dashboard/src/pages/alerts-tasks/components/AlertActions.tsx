import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { inlineErrorCopy } from "../services/api-call-error";
import {
  useAcknowledgeAlert,
  useCreateTaskFromAlert,
  useDeleteAlert,
  useDismissAlert,
  useSnoozeAlert,
} from "../services/alerts.service";
import type { Alert } from "../types/alerts.types";
import { InlineConfirmRow } from "./InlineConfirmRow";

export function AlertActions({ alert }: { alert: Alert }) {
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const acknowledge = useAcknowledgeAlert();
  const snooze = useSnoozeAlert();
  const dismiss = useDismissAlert();
  const createTask = useCreateTaskFromAlert();

  const onMutate = () => setError(null);
  const onError = (mutationError: unknown) => setError(inlineErrorCopy(mutationError));
  const pending =
    acknowledge.isPending || snooze.isPending || dismiss.isPending || createTask.isPending;

  return (
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
      {error ? <p className="text-xs text-volt-down">{error}</p> : null}
    </div>
  );
}

export function AlertDeleteAction({ alert }: { alert: Alert }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteAlert = useDeleteAlert();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost-danger"
          disabled={deleteAlert.isPending}
          onClick={() => setConfirming(true)}
        >
          Delete
        </Button>
      </div>
      {confirming ? (
        <InlineConfirmRow
          confirmLabel="Confirm delete"
          pending={deleteAlert.isPending}
          onConfirm={() => {
            setError(null);
            setConfirming(false);
            deleteAlert.mutate(alert.id, {
              onError: (mutationError) => setError(inlineErrorCopy(mutationError)),
            });
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
      {error ? <p className="text-xs text-volt-down">{error}</p> : null}
    </div>
  );
}
