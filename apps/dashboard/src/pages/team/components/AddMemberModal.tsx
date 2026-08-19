import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { memberFormError } from "../services/api-call-error";
import { useCreateMember } from "../services/team.service";
import type { CreateUserDto } from "../dto/team.dto";
import type { MemberRoleSelection } from "../types/team.types";
import { Select } from "./Select";

const ROLE_OPTIONS = [
  { value: "owner", label: "Agency — Owner" },
  { value: "admin", label: "Agency — Admin" },
  { value: "account_manager", label: "Agency — Account manager" },
  { value: "marketer", label: "Agency — Marketer" },
  { value: "analyst", label: "Agency — Analyst" },
  { value: "client_admin", label: "Client — Admin" },
  { value: "client_viewer", label: "Client — Viewer" },
];

type RoleBody = Omit<CreateUserDto, "email" | "password" | "displayName">;

const SELECTION_BODY: Record<MemberRoleSelection, RoleBody> = {
  owner: { role: "admin", agencyRole: "owner" },
  admin: { role: "admin", agencyRole: "admin" },
  account_manager: { role: "admin", agencyRole: "account_manager" },
  marketer: { role: "admin", agencyRole: "marketer" },
  analyst: { role: "admin", agencyRole: "analyst" },
  client_admin: { role: "client", clientRoleTier: "admin" },
  client_viewer: { role: "client", clientRoleTier: "viewer" },
};

export function AddMemberModal({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selection, setSelection] = useState<MemberRoleSelection>("owner");
  const [error, setError] = useState<string | null>(null);
  const createMember = useCreateMember();

  const submit = () => {
    setError(null);
    createMember.mutate(
      {
        ...SELECTION_BODY[selection],
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      },
      {
        onError: (mutationError) => setError(memberFormError(mutationError)),
        onSuccess: onClose,
      },
    );
  };

  const ready =
    displayName.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-volt-ground/70 px-4"
      onClick={onClose}
    >
      <section
        className="flex w-full max-w-md flex-col gap-4 rounded-[10px] border border-volt-border bg-volt-surface p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-volt-text">Add member</h2>
        <div className="flex flex-col gap-3">
          <Input
            label="Name"
            placeholder="Full name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="name@agency.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Temporary password (8+ characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Select
            label="Role"
            value={selection}
            options={ROLE_OPTIONS}
            onChange={(value) => setSelection(value as MemberRoleSelection)}
          />
        </div>
        {error ? <p className="text-xs text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={createMember.isPending || !ready} onClick={submit}>
            Add member
          </Button>
        </div>
      </section>
    </div>
  );
}
