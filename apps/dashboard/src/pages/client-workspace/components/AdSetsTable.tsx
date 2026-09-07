import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { campaignRowTone, formatDecimal, formatMoney, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot, entityStatusVariant, statusWords } from "@/shared/components/StatusDot";
import type { AdSet } from "../types/ad-sets.types";
import { nextSortState, sortHeaderCell, sortRows } from "./SortHeader";
import type { SortDirection, SortState } from "./SortHeader";

const DASH = "—";
const GHOST_ACTION_CLASS =
  "inline-flex cursor-pointer items-center rounded-wk border border-transparent bg-transparent px-3 py-1 text-xs font-semibold text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text";

export const MAX_COMPARE = 4;

function humanize(value: string | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLowerCase().replace(/_/g, " ");
}

type AdSetMetricKey = "dailyBudget" | "spend" | "revenue" | "roas" | "cpa" | "purchases" | "ctr" | "frequency";
type AdSetSortKey = "name" | AdSetMetricKey;

export interface AdSetsTableProps {
  adSets: AdSet[];
  selectedIds: string[];
  onToggle: (row: AdSet) => void;
  clientSlug: string;
}

export function AdSetsTable({ adSets, selectedIds, onToggle, clientSlug }: AdSetsTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);
  const rows = sortRows(adSets, sort, (row, key) => row[key as AdSetSortKey]);
  const header = (key: AdSetSortKey, label: string, fallback: SortDirection = "desc") =>
    sortHeaderCell({
      label,
      active: sort !== null && sort.key === key,
      direction: sort !== null && sort.key === key ? sort.direction : fallback,
      onClick: () => setSort(nextSortState(sort, key, fallback)),
    });
  const metric = (key: AdSetMetricKey, label: string, format: (row: AdSet) => string): DataTableColumn<AdSet> => ({
    key, header: header(key, label), align: "right",
    render: (row) => <span className="tabular">{format(row)}</span>,
  });
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
              disabled={!checked && selectedIds.length >= MAX_COMPARE}
              onChange={() => onToggle(row)}
              aria-label={`Compare ${row.name}`}
              className="size-4 cursor-pointer accent-volt-primary disabled:cursor-not-allowed disabled:opacity-40"
            />
          );
        },
    },
    {
      key: "name",
      header: header("name", "Ad set", "asc"),
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
      render: (row) => <StatusDot variant={entityStatusVariant(row.status)}>{statusWords(row.status)}</StatusDot>,
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
    metric("dailyBudget", "Budget", (row) => formatMoney(row.dailyBudget, row.currency)),
    metric("spend", "Spend", (row) => formatMoney(row.spend, row.currency)),
    metric("revenue", "Revenue", (row) => formatMoney(row.revenue, row.currency)),
    {
      key: "roas",
      header: header("roas", "ROAS"),
      align: "right",
      render: (row) => <span className={cn("tabular", roasTone(row.roas))}>{formatRoas(row.roas)}</span>,
    },
    metric("cpa", "CPA", (row) => formatMoney(row.cpa, row.currency)),
    metric("purchases", "Purchases", (row) => formatNumber(row.purchases)),
    metric("ctr", "CTR", (row) => formatPct(row.ctr)),
    metric("frequency", "Freq", (row) => formatDecimal(row.frequency)),
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <Link
          to="/clients/$slug" params={{ slug: clientSlug }}
          search={{ tab: "creatives", adSet: row.id, adSetName: row.name }}
          onClick={(event) => event.stopPropagation()} className={GHOST_ACTION_CLASS}
        >
          Creatives
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      rowClassName={(row) => campaignRowTone(row.roas)}
    />
  );
}
