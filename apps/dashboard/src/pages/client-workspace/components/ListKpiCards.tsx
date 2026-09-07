import { formatDecimal, formatMoney, formatNumber, formatPct, formatRoas } from "@/lib/format";
import { KpiCard } from "@/shared/components/KpiCard";
import type { KpiSummary } from "../types/kpi-summary.types";

export interface ListKpiCardsProps {
  summary: KpiSummary;
  currency: string;
}

export function ListKpiCards({ summary, currency }: ListKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <KpiCard label="Spend" value={formatMoney(summary.spend, currency)} />
      <KpiCard label="Revenue" value={formatMoney(summary.revenue, currency)} />
      <KpiCard label="Purchases" value={formatNumber(summary.purchases)} />
      <KpiCard label="ROAS" value={formatRoas(summary.roas)} />
      <KpiCard label="CPA" value={formatMoney(summary.cpa, currency)} />
      <KpiCard label="CTR" value={formatPct(summary.ctr)} />
      <KpiCard label="Frequency" value={formatDecimal(summary.frequency)} />
    </div>
  );
}
