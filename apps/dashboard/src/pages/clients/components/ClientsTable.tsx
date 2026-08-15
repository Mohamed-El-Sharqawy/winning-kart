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

export function ClientsTable({ clients }: { clients: Client[] }) {
  const columns: Array<DataTableColumn<Client>> = [
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium text-volt-text">{row.name}</span>,
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
  ];

  return <DataTable columns={columns} rows={clients} rowKey={(row) => row.id} />;
}
