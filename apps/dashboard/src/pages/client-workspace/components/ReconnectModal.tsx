import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { useReconnectAdAccount } from "../services/ad-accounts.service";
import type { AdAccount } from "../types/ad-accounts.types";
import { Modal } from "./Modal";
import { TokenField } from "./TokenField";

export function ReconnectModal({ account, onClose }: { account: AdAccount; onClose: () => void }) {
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reconnect = useReconnectAdAccount();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await reconnect.mutateAsync({ id: account.id, accessToken });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Reconnect failed");
    }
  }

  return (
    <Modal title={`Reconnect ${account.name}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          Paste a fresh system-user access token with ads_read and ads_management access to this ad
          account.
        </p>
        <label htmlFor="reconnect-token" className="flex flex-col gap-1.5 text-[13px] text-volt-text-2">
          Access token
          <TokenField id="reconnect-token" value={accessToken} onChange={setAccessToken} disabled={reconnect.isPending} />
        </label>
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={reconnect.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={reconnect.isPending || accessToken.trim().length === 0}>
            {reconnect.isPending ? "Reconnecting…" : "Reconnect"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
