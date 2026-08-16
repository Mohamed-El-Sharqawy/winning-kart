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
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { CampaignAdSet } from "../types/campaign-detail.types";

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

function toWords(value: string): string {
  return value.toLowerCase().replace(/_/g, " ");
}

export function AdSetsTable({ adSets }: { adSets: CampaignAdSet[] }) {
  if (adSets.length === 0) {
    return <EmptyState title="No ad sets in this window" hint="Ad sets appear once the campaign has activity." />;
  }

  const columns: Array<DataTableColumn<CampaignAdSet>> = [
    {
      key: "name",
      header: "Ad set",
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-volt-text">{row.name}</span>
          <StatusDot variant={statusVariant(row.status)}>{toWords(row.status)}</StatusDot>
        </div>
      ),
    },
    {
      key: "optimizationGoal",
      header: "Optimization goal",
      render: (row) => <span className="capitalize text-volt-text-3">{toWords(row.optimizationGoal)}</span>,
    },
    {
      key: "dailyBudget",
      header: "Budget",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.dailyBudget, row.currency)}</span>,
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
      rows={adSets}
      rowKey={(row) => row.id}
      rowClassName={(row) => campaignRowTone(row.roas)}
    />
  );
}
