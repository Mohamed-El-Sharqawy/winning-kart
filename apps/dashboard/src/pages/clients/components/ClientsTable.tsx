import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import type { BadgeVariant } from "@/shared/components/Badge";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import type { Client, ClientStatus } from "@/shared/types/clients.types";

const STATUS_VARIANTS: Record<ClientStatus, BadgeVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
};

type ActionTone = "ghost" | "ghost-danger";

function ActionButton({
  tone,
  children,
  ...props
}: { tone: ActionTone } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer rounded-wk border border-transparent px-2.5 py-1 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        tone === "ghost"
          ? "bg-transparent text-volt-text-2 hover:bg-volt-surface-2 hover:text-volt-text"
          : "bg-transparent text-volt-down hover:bg-volt-down-tint",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  const navigate = useNavigate();

  const columns: Array<DataTableColumn<Client>> = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <Link
          to="/clients/$slug"
          params={{ slug: row.slug }}
          search={{ tab: "overview" }}
          className="font-medium text-volt-primary-strong hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (row) => <span className="font-mono text-volt-text-3">{row.slug}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status]}>{row.status}</Badge>,
    },
    { key: "displayCurrency", header: "Currency" },
    {
      key: "createdAt",
      header: "Created",
      align: "right",
      render: (row) => <span className="tabular">{formatDate(row.createdAt)}</span>,
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
      rows={clients}
      rowKey={(row) => row.id}
      onRowClick={(row) =>
        void navigate({
          to: "/clients/$slug",
          params: { slug: row.slug },
          search: { tab: "overview" },
        })
      }
    />
  );
}
