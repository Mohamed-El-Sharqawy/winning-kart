import { cn } from "@/lib/cn";

export interface KpiDeltaChipProps {
  current: number | null;
  prev: number | null;
  higherIsBetter: boolean;
}

export function KpiDeltaChip({ current, prev, higherIsBetter }: KpiDeltaChipProps) {
  if (current === null || prev === null || prev === 0) {
    return <span className="tabular text-xs text-volt-text-3">—</span>;
  }
  const deltaPct = ((current - prev) / Math.abs(prev)) * 100;
  const up = deltaPct >= 0;
  const good = higherIsBetter ? up : !up;
  return (
    <span
      data-testid="kpi-delta-chip"
      className={cn("tabular text-xs font-semibold", good ? "text-volt-up" : "text-volt-down")}
    >
      {up ? "▲" : "▼"} {Math.abs(Math.round(deltaPct))}%
    </span>
  );
}
