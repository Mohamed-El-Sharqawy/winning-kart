import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import { memberFormError } from "../services/api-call-error";
import { useDeleteMember } from "../services/team.service";
import type { Member } from "../types/team.types";

export function DeleteMemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const deleteMember = useDeleteMember();
  const matched = email.trim() === member.email && email.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteMember.mutateAsync(member.id);
      onClose();
    } catch (submitError) {
      setError(memberFormError(submitError));
    }
  }

  return (
    <Modal title={`Delete ${member.displayName}`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          This permanently removes{" "}
          <span className="font-medium text-volt-text">{member.displayName}</span> from the
          workspace. Type the email{" "}
          <code className="font-mono text-volt-text">{member.email}</code> to confirm.
        </p>
        <Input
          label="Member email"
          placeholder={member.email}
          value={email}
          disabled={deleteMember.isPending}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={deleteMember.isPending}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={!matched || deleteMember.isPending}>
            {deleteMember.isPending ? "Deleting…" : "Delete member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
