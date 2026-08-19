import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import { clearWorkspaceClient, readWorkspaceClient } from "@/shared/lib/workspace-client";
import { useDeleteClient } from "@/shared/services/clients.service";
import type { Client } from "@/shared/types/clients.types";
import { clientFormError } from "../services/client-form-error";

export function DeleteClientModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const deleteClient = useDeleteClient();
  const matched = slug.trim() === client.slug && slug.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteClient.mutateAsync({ id: client.id, confirmSlug: slug.trim() });
      const workspaceClient = readWorkspaceClient();
      if (workspaceClient?.slug === client.slug) clearWorkspaceClient();
      onClose();
    } catch (submitError) {
      setError(clientFormError(submitError, "Failed to delete client"));
    }
  }

  return (
    <Modal title={`Delete ${client.name}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          This permanently removes{" "}
          <span className="font-medium text-volt-text">{client.name}</span>, its ad accounts,
          synced data and revenue history. Type the slug{" "}
          <code className="font-mono text-volt-text">{client.slug}</code> to confirm.
        </p>
        <Input
          label="Client slug"
          placeholder={client.slug}
          value={slug}
          disabled={deleteClient.isPending}
          onChange={(event) => setSlug(event.target.value)}
        />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={deleteClient.isPending}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={!matched || deleteClient.isPending}>
            {deleteClient.isPending ? "Deleting…" : "Delete client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
