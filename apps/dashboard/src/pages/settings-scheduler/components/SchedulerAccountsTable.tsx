import { formatRelativeTime } from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot, healthDotVariant } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import { cn } from "@/lib/cn";
import type { SchedulerAccount } from "../types/scheduler.types";

const JOB_STATUS_DOTS: Record<string, StatusDotVariant> = {
  succeeded: "up",
  success: "up",
  completed: "up",
  failed: "down",
  running: "warning",
  queued: "neutral",
  pending: "neutral",
};

function jobDotVariant(status: string): StatusDotVariant {
  return JOB_STATUS_DOTS[status] ?? "neutral";
}

export function SchedulerAccountsTable({ accounts }: { accounts: SchedulerAccount[] }) {
  const columns: Array<DataTableColumn<SchedulerAccount>> = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-volt-text">{row.name}</span>
          <span className="font-mono text-xs text-volt-text-3">{row.adAccountId}</span>
        </div>
      ),
    },
    {
      key: "healthState",
      header: "Health",
      render: (row) => <StatusDot variant={healthDotVariant(row.healthState)}>{row.healthState}</StatusDot>,
    },
    {
      key: "lastSyncAt",
      header: "Last sync",
      render: (row) => <span className="tabular">{formatRelativeTime(row.lastSyncAt)}</span>,
    },
    {
      key: "lastJob",
      header: "Last job",
      render: (row) =>
        row.lastJob ? (
          <StatusDot variant={jobDotVariant(row.lastJob.status)}>
            {row.lastJob.stage} · {row.lastJob.status}
          </StatusDot>
        ) : (
          <span className="text-volt-text-3">—</span>
        ),
    },
    {
      key: "recentFailures",
      header: "Recent failures 24h",
      align: "right",
      render: (row) => (
        <span
          className={cn(
            "tabular font-mono",
            row.recentFailures > 0 ? "text-volt-down" : "text-volt-text-3",
          )}
        >
          {row.recentFailures}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} rows={accounts} rowKey={(row) => row.adAccountId} />;
}
