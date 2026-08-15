import { cn } from "@/lib/cn";
import {
  campaignRowTone,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatPct,
  formatRoas,
  roasTone,
} from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { Campaign } from "../types/ad-accounts.types";

const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
  pending: "warning",
  in_review: "warning",
  with_issues: "down",
};

function statusVariant(status: string): StatusDotVariant {
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const columns: Array<DataTableColumn<Campaign>> = [
    {
      key: "name",
      header: "Campaign",
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-volt-text">{row.name}</span>
          <StatusDot variant={statusVariant(row.status)}>
            {row.status.toLowerCase().replace(/_/g, " ")}
          </StatusDot>
        </div>
      ),
    },
    {
      key: "objective",
      header: "Objective",
      render: (row) => (
        <span className="capitalize text-volt-text-3">{row.objective.toLowerCase().replace(/_/g, " ")}</span>
      ),
    },
    {
      key: "spend",
      header: "Spend",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.spend, row.currency)}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.revenue, row.currency)}</span>,
    },
    {
      key: "roas",
      header: "ROAS",
      align: "right",
      render: (row) => <span className={cn("tabular", roasTone(row.roas))}>{formatRoas(row.roas)}</span>,
    },
    {
      key: "cpa",
      header: "CPA",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.cpa, row.currency)}</span>,
    },
    {
      key: "purchases",
      header: "Purchases",
      align: "right",
      render: (row) => <span className="tabular">{formatNumber(row.purchases)}</span>,
    },
    {
      key: "ctr",
      header: "CTR",
      align: "right",
      render: (row) => <span className="tabular">{formatPct(row.ctr)}</span>,
    },
    {
      key: "frequency",
      header: "Freq",
      align: "right",
      render: (row) => <span className="tabular">{formatDecimal(row.frequency)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={campaigns}
      rowKey={(row) => row.id}
      rowClassName={(row) => campaignRowTone(row.roas)}
    />
  );
}
