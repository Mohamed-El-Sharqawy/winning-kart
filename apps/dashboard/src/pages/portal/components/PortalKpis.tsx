import { cn } from "@/lib/cn";
import { formatAed, formatNumber, formatRoas, roasTone } from "@/lib/format";
import type { PortalKpis } from "../types/portal.types";

interface KpiTileProps {
  label: string;
  value: string;
  sub: string;
}

function KpiTile({ label, value, sub }: KpiTileProps) {
  return (
    <div className="rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">{label}</p>
      <p className="tabular mt-2 text-2xl font-semibold text-volt-text">{value}</p>
      <p className="mt-1.5 text-xs text-volt-text-3">{sub}</p>
    </div>
  );
}

export interface PortalKpisProps {
  kpis: PortalKpis;
}

export function PortalKpis({ kpis }: PortalKpisProps) {
  const trustLine =
    kpis.roas !== null && kpis.spend > 0
      ? `You earned ${formatAed(kpis.roas)} for every AED 1 spent`
      : "—";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile label="Spend" value={formatAed(kpis.spend)} sub="invested in your campaigns" />
      <KpiTile label="Revenue" value={formatAed(kpis.revenue)} sub="attributed to your ads" />
      <div className="rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">ROAS</p>
        <p className={cn("tabular mt-2 text-3xl font-semibold", roasTone(kpis.roas))}>
          {formatRoas(kpis.roas)}
        </p>
        <p className="mt-1.5 text-xs text-volt-text-3">{trustLine}</p>
      </div>
      <KpiTile label="Purchases" value={formatNumber(kpis.purchases)} sub="orders attributed" />
    </div>
  );
}
