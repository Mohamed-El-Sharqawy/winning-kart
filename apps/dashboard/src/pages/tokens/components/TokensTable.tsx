import { formatDate } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import type { BadgeVariant } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { useRevokePat } from "../services/tokens.service";
import type { Pat, PatStatus } from "../types/tokens.types";

const STATUS_VARIANTS: Record<PatStatus, BadgeVariant> = {
  active: "up",
  revoked: "neutral",
};

export function TokensTable({ pats }: { pats: Pat[] }) {
  const revokePat = useRevokePat();

  const columns: Array<DataTableColumn<Pat>> = [
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium text-volt-text">{row.name}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => <span className="tabular">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "lastUsedAt",
      header: "Last used",
      render: (row) => (
        <span className="tabular">{row.lastUsedAt ? formatDate(row.lastUsedAt) : "Never"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status]}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        row.status === "active" ? (
          <Button
            variant="ghost-danger"
            disabled={revokePat.isPending}
            onClick={() => {
              if (window.confirm(`Revoke token "${row.name}"?`)) revokePat.mutate(row.id);
            }}
          >
            Revoke
          </Button>
        ) : null,
    },
  ];

  return <DataTable columns={columns} rows={pats} rowKey={(row) => row.id} />;
}
