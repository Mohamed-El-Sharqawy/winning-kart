import { formatRelativeTime } from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { SchedulerJob } from "../types/scheduler.types";

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s`;
}

export function SchedulerJobsTable({ jobs }: { jobs: SchedulerJob[] }) {
  const columns: Array<DataTableColumn<SchedulerJob>> = [
    {
      key: "accountName",
      header: "Ad account",
      render: (row) => <span className="font-medium text-volt-text">{row.accountName}</span>,
    },
    {
      key: "stage",
      header: "Stage",
      render: (row) => row.stage,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusDot variant={jobDotVariant(row.status)}>{row.status}</StatusDot>,
    },
    {
      key: "errorClass",
      header: "Error class",
      render: (row) =>
        row.errorClass ? (
          <span className="font-mono text-xs text-volt-down">{row.errorClass}</span>
        ) : (
          <span className="text-volt-text-3">—</span>
        ),
    },
    {
      key: "startedAt",
      header: "Started",
      render: (row) => <span className="tabular">{formatRelativeTime(row.startedAt)}</span>,
    },
    {
      key: "durationSeconds",
      header: "Duration",
      align: "right",
      render: (row) => (
        <span className="tabular font-mono">
          {row.durationSeconds === null ? "—" : formatDuration(row.durationSeconds)}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} rows={jobs} rowKey={(row) => row.id} />;
}
