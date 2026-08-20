import { formatRelativeTime } from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot } from "@/shared/components/StatusDot";
import type { AuditLog } from "../types/audit-logs.types";

function shortId(value: string | null): string {
  if (value === null) return "—";
  return value.length > 8 ? `${value.slice(0, 8)}…` : value;
}

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const columns: Array<DataTableColumn<AuditLog>> = [
    {
      key: "occurredAt",
      header: "When",
      render: (row) => <span className="tabular">{formatRelativeTime(row.occurredAt)}</span>,
    },
    { key: "actorType", header: "Actor type" },
    {
      key: "actorUserId",
      header: "Actor",
      render: (row) => (
        <span className="font-mono text-xs text-volt-text-3">{shortId(row.actorUserId)}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => <span className="font-mono text-xs">{row.action}</span>,
    },
    {
      key: "target",
      header: "Target",
      render: (row) => (
        <span>
          {row.targetEntityType}
          {row.targetEntityId ? (
            <span className="ml-2 font-mono text-xs text-volt-text-3">
              {shortId(row.targetEntityId)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "outcome",
      header: "Outcome",
      render: (row) => (
        <StatusDot
          variant={row.outcome === "success" ? "up" : row.outcome === "failure" ? "down" : "neutral"}
        >
          {row.outcome}
        </StatusDot>
      ),
    },
    {
      key: "ip",
      header: "IP",
      render: (row) => <span className="font-mono text-xs">{row.ip ?? "—"}</span>,
    },
  ];

  return <DataTable columns={columns} rows={logs} rowKey={(row) => row.id} />;
}
