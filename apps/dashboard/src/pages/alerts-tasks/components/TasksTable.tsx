import { formatDate } from "@/lib/format";
import { ActionButton } from "@/shared/components/ActionButton";
import { Badge } from "@/shared/components/Badge";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { Task, TaskStatus } from "../types/tasks.types";

const STATUS_VARIANTS: Record<TaskStatus, StatusDotVariant> = {
  todo: "neutral",
  in_progress: "warning",
  done: "up",
  skipped: "neutral",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
};

interface TasksTableProps {
  tasks: Task[];
  selectedId: string | null;
  onRowClick: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TasksTable({ tasks, selectedId, onRowClick, onEdit, onDelete }: TasksTableProps) {
  const columns: Array<DataTableColumn<Task>> = [
    {
      key: "title",
      header: "Title",
      render: (row) => <span className="font-medium text-volt-text">{row.title}</span>,
    },
    { key: "clientName", header: "Client", render: (row) => row.clientName ?? "—" },
    { key: "entityName", header: "Entity", render: (row) => row.entityName ?? "—" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Badge variant={row.priority === "urgent" ? "down" : "neutral"}>{row.priority}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusDot variant={STATUS_VARIANTS[row.status]}>{STATUS_LABELS[row.status]}</StatusDot>,
    },
    {
      key: "assigneeName",
      header: "Assignee",
      render: (row) => row.assigneeName ?? <span className="text-volt-text-3">Unassigned</span>,
    },
    {
      key: "dueDate",
      header: "Due",
      render: (row) => (
        <span className="font-mono tabular-nums">{row.dueDate ? formatDate(row.dueDate) : "—"}</span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (row) => (
        <span className="rounded-full border border-volt-border bg-volt-surface-2 px-2 py-0.5 text-xs text-volt-text-3">
          {row.source}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div
          className="flex justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <ActionButton tone="ghost" onClick={() => onEdit(row)}>
            Edit
          </ActionButton>
          <ActionButton tone="ghost-danger" onClick={() => onDelete(row)}>
            Delete
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={tasks}
      rowKey={(row) => row.id}
      onRowClick={onRowClick}
      rowClassName={(row) => (row.id === selectedId ? "bg-volt-surface-2/60" : "")}
    />
  );
}
