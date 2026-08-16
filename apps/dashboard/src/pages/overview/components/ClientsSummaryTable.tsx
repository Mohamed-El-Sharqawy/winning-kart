import { Link } from "@tanstack/react-router";
import { formatAed, formatRoas, roasTone } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import type { OverviewClientRow } from "@/shared/types/overview.types";

export function ClientsSummaryTable({ clients }: { clients: OverviewClientRow[] }) {
  const columns: Array<DataTableColumn<OverviewClientRow>> = [
    {
      key: "name",
      header: "Client",
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
      key: "spend",
      header: "Spend",
      align: "right",
      render: (row) => <span className="tabular">{formatAed(row.spend)}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (row) => <span className="tabular">{formatAed(row.revenue)}</span>,
    },
    {
      key: "roas",
      header: "ROAS",
      align: "right",
      render: (row) => (
        <span className={cn("tabular", roasTone(row.roas))}>{formatRoas(row.roas)}</span>
      ),
    },
  ];

  return <DataTable columns={columns} rows={clients} rowKey={(row) => row.id} />;
}
