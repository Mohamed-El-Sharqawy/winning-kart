import { cn } from "@/lib/cn";
import { formatAed, formatRoas, roasTone } from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusDot, entityStatusVariant, statusWords } from "@/shared/components/StatusDot";
import type { PortalCampaign } from "../types/portal.types";

export interface CampaignsSectionProps {
  campaigns: PortalCampaign[];
}

export function CampaignsSection({ campaigns }: CampaignsSectionProps) {
  const rows = campaigns.slice(0, 10);
  const columns: Array<DataTableColumn<PortalCampaign>> = [
    {
      key: "name",
      header: "Campaign",
      render: (row) => <span className="font-medium text-volt-text">{row.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusDot variant={entityStatusVariant(row.status)}>{statusWords(row.status)}</StatusDot>,
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
      render: (row) => <span className={cn("tabular", roasTone(row.roas))}>{formatRoas(row.roas)}</span>,
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-volt-text">Your campaigns</h2>
      {rows.length === 0 ? (
        <EmptyState title="No campaigns yet" hint="Campaigns appear here once your agency launches them." />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      )}
    </section>
  );
}
