import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import { AddMemberModal } from "./components/AddMemberModal";
import { MembersTable } from "./components/MembersTable";
import { SkeletonRows } from "./components/SkeletonRows";
import { useMembers } from "./services/team.service";

export function TeamPage() {
  const { data: members, isPending, isError } = useMembers();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-volt-text">Team & Permissions</h1>
            <p className="mt-1 text-sm text-volt-text-3">Members</p>
            <p className="mt-1 text-[13px] italic text-volt-text-3">
              Roles gate actions server-side; per-role navigation arrives with the permission
              matrix (V1).
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Add member</Button>
        </div>
        {isPending ? (
          <SkeletonRows rows={6} columns={6} />
        ) : isError ? (
          <p className="text-sm text-volt-down">Failed to load members.</p>
        ) : members && members.length > 0 ? (
          <MembersTable members={members} />
        ) : (
          <EmptyState
            title="No members yet"
            hint="Invite an agency teammate or a client contact to get started."
          />
        )}
        {modalOpen ? <AddMemberModal onClose={() => setModalOpen(false)} /> : null}
      </div>
    </AppShell>
  );
}
