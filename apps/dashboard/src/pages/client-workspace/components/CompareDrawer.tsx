import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { formatDecimal, formatMoney, formatNumber, formatPct, formatRoas } from "@/lib/format";
import { Button } from "@/shared/components/Button";
import type { AdSet } from "../types/ad-sets.types";

type MetricKind = "money" | "number" | "decimal" | "pct" | "roas";

interface MetricDef {
  key: keyof AdSet;
  label: string;
  kind: MetricKind;
  inverted?: boolean;
}

const METRIC_GROUPS: Array<{ title: string; metrics: MetricDef[] }> = [
  { title: "Volume", metrics: [
    { key: "spend", label: "Spend", kind: "money" },
    { key: "reach", label: "Reach", kind: "number" },
    { key: "frequency", label: "Frequency", kind: "decimal" },
  ] },
  { title: "Efficiency", metrics: [
    { key: "cpm", label: "CPM", kind: "money", inverted: true },
    { key: "cpc", label: "CPC", kind: "money", inverted: true },
    { key: "ctr", label: "CTR", kind: "pct" },
  ] },
  { title: "Conversion", metrics: [
    { key: "purchases", label: "Purchases", kind: "number" },
    { key: "cpa", label: "CPA", kind: "money", inverted: true },
    { key: "revenue", label: "Revenue", kind: "money" },
    { key: "roas", label: "ROAS", kind: "roas" },
  ] },
];

function formatMetric(def: MetricDef, value: number | null, currency: string): string {
  switch (def.kind) {
    case "money":
      return formatMoney(value, currency);
    case "number":
      return formatNumber(value);
    case "decimal":
      return formatDecimal(value);
    case "pct":
      return formatPct(value);
    case "roas":
      return formatRoas(value);
  }
}

function delta(value: number | null, baseline: number | null): number | null {
  if (value === null || baseline === null || baseline === 0) return null;
  return (value - baseline) / baseline;
}

function deltaTone(d: number | null, inverted: boolean): string {
  if (d === null || Math.abs(d) < 0.1) return "text-volt-text-3";
  const better = inverted ? d < 0 : d > 0;
  return better ? "text-volt-up" : "text-volt-down";
}

export interface CompareDrawerProps {
  adSets: AdSet[];
  open: boolean;
  onClose: () => void;
}

export function CompareDrawer({ adSets, open, onClose }: CompareDrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || adSets.length === 0) return null;

  const baseline = adSets[0];
  const currency = baseline.currency;
  const mixedGoals = new Set(adSets.map((set) => set.optimizationGoal)).size > 1;
  const gridStyle = { gridTemplateColumns: `128px repeat(${adSets.length}, minmax(0, 1fr))` };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside
        className="absolute inset-y-0 right-0 flex w-[520px] max-w-full flex-col border-l border-volt-border bg-volt-surface"
        role="dialog"
        aria-modal="true"
        aria-label="Compare ad sets"
      >
        <header className="flex items-center justify-between gap-4 border-b border-volt-border px-5 py-4">
          <h2 className="text-sm font-semibold text-volt-text">Compare ad sets</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mixedGoals ? (
            <p className="mb-4 rounded-[10px] border border-volt-border bg-volt-down-tint/30 px-4 py-3 text-[13px] text-volt-text-2">
              Ad sets optimize for different events — comparison is indicative only
            </p>
          ) : null}
          <div className="grid items-end gap-x-3 border-b border-volt-border pb-3" style={gridStyle}>
            <span />
            {adSets.map((set, index) => (
              <div key={set.id} className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[13px] font-medium text-volt-text" title={set.name}>
                  {set.name}
                </span>
                {index === 0 ? (
                  <span className="w-fit rounded-full border border-volt-border bg-volt-surface-2 px-2 py-0.5 text-[11px] text-volt-text-3">
                    baseline
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {METRIC_GROUPS.map((group) => (
            <section key={group.title} className="mt-5">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-volt-text-3">{group.title}</h3>
              {group.metrics.map((metric) => (
                <div key={metric.key} className="grid items-baseline gap-x-3 border-b border-volt-border py-2.5" style={gridStyle}>
                  <span className="text-[13px] text-volt-text-2">{metric.label}</span>
                  {adSets.map((set, index) => {
                    const value = set[metric.key] as number | null;
                    const d = index === 0 ? null : delta(value, baseline[metric.key] as number | null);
                    return (
                      <div key={set.id} className="flex min-w-0 flex-col">
                        <span className="tabular text-[13px] text-volt-text">{formatMetric(metric, value, currency)}</span>
                        {d !== null ? (
                          <span className={cn("tabular text-[11px]", deltaTone(d, metric.inverted === true))}>
                            {`${d >= 0 ? "+" : "-"}${Math.round(Math.abs(d) * 100)}%`}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
