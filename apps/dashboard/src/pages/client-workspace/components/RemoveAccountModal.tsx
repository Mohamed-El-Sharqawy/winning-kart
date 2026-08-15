import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { ApiCallError, useRemoveAdAccount } from "../services/ad-accounts.service";
import type { AdAccount } from "../types/ad-accounts.types";
import { Modal } from "./Modal";

export function RemoveAccountModal({ account, onClose }: { account: AdAccount; onClose: () => void }) {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const remove = useRemoveAdAccount();
  const matched = slug.trim() === account.slug && slug.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await remove.mutateAsync({ id: account.id, confirmSlug: slug.trim() });
      onClose();
    } catch (submitError) {
      if (submitError instanceof ApiCallError && submitError.errorClass === "slug mismatch") {
        setError("Slug mismatch — type the slug exactly as shown.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "Failed to remove ad account");
      }
    }
  }

  return (
    <Modal title={`Remove ${account.name}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          This permanently removes the ad account and its synced data. Type the slug{" "}
          <code className="font-mono text-volt-text">{account.slug}</code> to confirm.
        </p>
        <Input
          label="Ad account slug"
          placeholder={account.slug}
          value={slug}
          disabled={remove.isPending}
          onChange={(event) => setSlug(event.target.value)}
        />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={!matched || remove.isPending}>
            {remove.isPending ? "Removing…" : "Remove ad account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
