import { formatMoney, formatRelativeTime } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import type { BadgeVariant } from "@/shared/components/Badge";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import type { MatchTier, RevenueEvent } from "../types/revenue.types";

const TIER_VARIANTS: Record<MatchTier, BadgeVariant> = {
  A: "up",
  B: "neutral",
  C: "down",
};

export function RevenueEventsTable({ events }: { events: RevenueEvent[] }) {
  const columns: Array<DataTableColumn<RevenueEvent>> = [
    {
      key: "sourceOrderId",
      header: "Order id",
      render: (row) => <span className="font-mono text-xs">{row.sourceOrderId}</span>,
    },
    {
      key: "tsUtc",
      header: "When",
      render: (row) => <span className="tabular">{formatRelativeTime(row.tsUtc)}</span>,
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      render: (row) => <span className="tabular font-mono">{formatMoney(row.value, row.currency)}</span>,
    },
    {
      key: "matchTier",
      header: "Tier",
      render: (row) => <Badge variant={TIER_VARIANTS[row.matchTier]}>{row.matchTier}</Badge>,
    },
    {
      key: "campaignName",
      header: "Campaign",
      render: (row) =>
        row.campaignName ? (
          <span className="text-volt-text">{row.campaignName}</span>
        ) : (
          <span className="text-volt-text-3">—</span>
        ),
    },
    { key: "sourceName", header: "Source" },
  ];

  return <DataTable columns={columns} rows={events} rowKey={(row) => row.id} />;
}
