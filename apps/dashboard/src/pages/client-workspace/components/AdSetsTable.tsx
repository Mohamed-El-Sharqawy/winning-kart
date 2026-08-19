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
import type { AdSet } from "../types/ad-sets.types";

const DASH = "—";

const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
  pending: "warning",
  in_review: "warning",
  with_issues: "down",
};

function statusVariant(status: string | null | undefined): StatusDotVariant {
  if (status === null || status === undefined) return "neutral";
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

function humanize(value: string | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLowerCase().replace(/_/g, " ");
}

export interface AdSetsTableProps {
  adSets: AdSet[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function AdSetsTable({ adSets, selectedIds, onToggle }: AdSetsTableProps) {
  const columns: Array<DataTableColumn<AdSet>> = [
    {
      key: "compare",
      header: "",
      render: (row) => {
        const checked = selectedIds.includes(row.id);
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled={!checked && selectedIds.length >= 4}
            onChange={() => onToggle(row.id)}
            aria-label={`Compare ${row.name}`}
            className="size-4 cursor-pointer accent-volt-primary disabled:cursor-not-allowed disabled:opacity-40"
          />
        );
      },
    },
    {
      key: "name",
      header: "Ad set",
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-volt-text">{row.name}</span>
          <span className="text-xs text-volt-text-3">{row.campaignName}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusDot variant={statusVariant(row.status)}>{humanize(row.status)}</StatusDot>,
    },
    {
      key: "optimizationGoal",
      header: "Optimization goal",
      render: (row) => <span className="capitalize text-volt-text-3">{humanize(row.optimizationGoal)}</span>,
    },
    {
      key: "bidStrategy",
      header: "Bid strategy",
      render: (row) => <span className="capitalize text-volt-text-3">{humanize(row.bidStrategy)}</span>,
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
      rows={adSets}
      rowKey={(row) => row.id}
      rowClassName={(row) => campaignRowTone(row.roas)}
    />
  );
}
