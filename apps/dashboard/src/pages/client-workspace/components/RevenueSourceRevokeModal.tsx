import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { ApiCallError } from "../services/ad-accounts.service";
import { useRevokeRevenueSource } from "../services/revenue.service";
import type { RevenueSource } from "../types/revenue.types";
import { Modal } from "./Modal";

export interface RevenueSourceRevokeModalProps {
  clientId: string;
  source: RevenueSource;
  onClose: () => void;
}

export function RevenueSourceRevokeModal({ clientId, source, onClose }: RevenueSourceRevokeModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const revoke = useRevokeRevenueSource(clientId);
  const matched = name.trim() === source.name && name.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await revoke.mutateAsync({ id: source.id, confirmName: name.trim() });
      onClose();
    } catch (submitError) {
      if (submitError instanceof ApiCallError && submitError.errorClass === "NAME_MISMATCH") {
        setError("Name mismatch — type the source name exactly as shown.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "Failed to revoke source");
      }
    }
  }

  return (
    <Modal title={`Revoke ${source.name}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          This permanently revokes the ingest key for this source. Type the name{" "}
          <code className="font-mono text-volt-text">{source.name}</code> to confirm.
        </p>
        <Input
          label="Source name"
          placeholder={source.name}
          value={name}
          disabled={revoke.isPending}
          onChange={(event) => setName(event.target.value)}
        />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={revoke.isPending}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={!matched || revoke.isPending}>
            {revoke.isPending ? "Revoking…" : "Revoke source"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
