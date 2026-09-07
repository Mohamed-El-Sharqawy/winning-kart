import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import { memberFormError } from "../services/api-call-error";
import { useUpdateMember } from "../services/team.service";
import type { Member, MemberRoleSelection, MemberStatus } from "../types/team.types";
import {
  ROLE_OPTIONS,
  SELECTION_BODY,
  STATUS_OPTIONS,
  isClientSelection,
  selectionFromMember,
} from "./role-options";
import { Select } from "./Select";
import { ClientSelect } from "./ClientSelect";

export function EditMemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [selection, setSelection] = useState<MemberRoleSelection>(selectionFromMember(member));
  const [status, setStatus] = useState<MemberStatus>(member.status);
  const [clientId, setClientId] = useState(member.clientId ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateMember = useUpdateMember();

  const clientSelected = isClientSelection(selection);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await updateMember.mutateAsync({
        id: member.id,
        displayName: displayName.trim(),
        status,
        ...SELECTION_BODY[selection],
        ...(clientSelected && clientId.length > 0 ? { clientId } : {}),
      });
      onClose();
    } catch (submitError) {
      setError(memberFormError(submitError));
    }
  }

  const ready = displayName.trim().length > 0 && (!clientSelected || clientId.length > 0);

  return (
    <Modal title={`Edit ${member.displayName}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <Input
            label="Name"
            placeholder="Full name"
            value={displayName}
            disabled={updateMember.isPending}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <Select
            label="Role"
            value={selection}
            options={ROLE_OPTIONS}
            onChange={(value) => setSelection(value as MemberRoleSelection)}
          />
          {clientSelected ? (
            <ClientSelect
              value={clientId}
              onChange={setClientId}
              disabled={updateMember.isPending}
            />
          ) : null}
          <Select
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => setStatus(value as MemberStatus)}
          />
        </div>
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={updateMember.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready || updateMember.isPending}>
            {updateMember.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
