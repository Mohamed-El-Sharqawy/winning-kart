import { formatDate, formatRelativeTime } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { Member, MemberStatus } from "../types/team.types";

const STATUS_VARIANTS: Record<MemberStatus, StatusDotVariant> = {
  active: "up",
  invited: "neutral",
  suspended: "down",
};

function capitalizeRole(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function roleLabel(member: Member): string {
  if (member.role === "client") {
    return `client · ${member.clientRoleTier ?? "viewer"}`;
  }
  return capitalizeRole(member.agencyRole ?? "admin");
}

export function MembersTable({ members }: { members: Member[] }) {
  const columns: Array<DataTableColumn<Member>> = [
    {
      key: "displayName",
      header: "Name",
      render: (row) => <span className="font-medium text-volt-text">{row.displayName}</span>,
    },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (row) => <Badge>{roleLabel(row)}</Badge> },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusDot variant={STATUS_VARIANTS[row.status]}>{row.status}</StatusDot>,
    },
    {
      key: "lastActiveAt",
      header: "Last active",
      render: (row) => <span className="tabular">{formatRelativeTime(row.lastActiveAt)}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => <span className="tabular">{formatDate(row.createdAt)}</span>,
    },
  ];

  return <DataTable columns={columns} rows={members} rowKey={(row) => row.id} />;
}
