import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { useCreateRevenueSource } from "../services/revenue.service";
import type { CreatedRevenueSource } from "../types/revenue.types";
import { Modal } from "./Modal";

export interface RevenueSourceCreateModalProps {
  clientId: string;
  onClose: () => void;
  onCreated: (source: CreatedRevenueSource) => void;
}

export function RevenueSourceCreateModal({ clientId, onClose, onCreated }: RevenueSourceCreateModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateRevenueSource(clientId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const created = await create.mutateAsync(trimmed);
      onCreated(created);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create source");
    }
  }

  return (
    <Modal title="Generate ingest key" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          Name this revenue source. The ingest key is shown once after creation.
        </p>
        <Input
          label="Source name"
          placeholder="e.g. Shopify store"
          value={name}
          maxLength={100}
          disabled={create.isPending}
          onChange={(event) => setName(event.target.value)}
          required
        />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending || name.trim().length === 0}>
            {create.isPending ? "Generating…" : "Generate key"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
