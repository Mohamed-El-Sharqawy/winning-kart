import { useEffect, useMemo, useState } from "react";
import { formatDecimal, formatMoney, formatNumber, formatRoas } from "@/lib/format";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { KpiCard } from "@/shared/components/KpiCard";
import { useAdSets } from "../services/ad-sets.service";
import type { AdSet } from "../types/ad-sets.types";
import { AdSetsTable } from "./AdSetsTable";
import { CompareDrawer } from "./CompareDrawer";
import { SkeletonRows } from "./SkeletonRows";

const MAX_COMPARE = 4;

export interface AdSetsTabProps {
  accountId: string | null;
  days: number;
  clientSlug: string;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function metricValues(rows: AdSet[], key: keyof AdSet): number[] {
  return rows.map((row) => row[key]).filter((value): value is number => typeof value === "number");
}

export function AdSetsTab({ accountId, days, clientSlug }: AdSetsTabProps) {
  const { data: adSets, isPending } = useAdSets(accountId, days);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const rows = useMemo(() => adSets ?? [], [adSets]);
  const selected = rows.filter((row) => selectedIds.includes(row.id));

  useEffect(() => {
    const ids = new Set((adSets ?? []).map((row) => row.id));
    setSelectedIds((current) =>
      current.every((id) => ids.has(id)) ? current : current.filter((id) => ids.has(id)),
    );
  }, [adSets]);

  useEffect(() => {
    if (compareOpen && selected.length < 2) setCompareOpen(false);
  }, [compareOpen, selected.length]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((candidate) => candidate !== id);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, id];
    });
  }

  const totals = useMemo(() => {
    const spend = sum(metricValues(rows, "spend"));
    const revenue = sum(metricValues(rows, "revenue"));
    const purchases = sum(metricValues(rows, "purchases"));
    const reach = sum(metricValues(rows, "reach"));
    const weighted = rows.filter((row) => row.frequency !== null && row.reach !== null);
    const impressions = sum(weighted.map((row) => (row.frequency as number) * (row.reach as number)));
    const weightedReach = sum(weighted.map((row) => row.reach as number));
    return {
      currency: rows[0]?.currency ?? "AED",
      spend,
      roas: ratio(revenue, spend),
      cpa: ratio(spend, purchases),
      frequency: ratio(impressions, weightedReach),
      reach,
    };
  }, [rows]);

  if (isPending) {
    return <SkeletonRows rows={8} columns={10} />;
  }
  if (rows.length === 0) {
    return <EmptyState title="No ad sets yet" hint="Sync the ad account to pull ad sets." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Spend" value={formatMoney(totals.spend, totals.currency)} meta={`${rows.length} ad sets`} />
        <KpiCard label="ROAS" value={formatRoas(totals.roas)} />
        <KpiCard label="CPA" value={formatMoney(totals.cpa, totals.currency)} />
        <KpiCard label="Frequency" value={formatDecimal(totals.frequency)} />
        <KpiCard label="Reach" value={formatNumber(totals.reach)} />
      </div>
      <div className="flex items-center justify-end gap-3">
        {selected.length === MAX_COMPARE ? (
          <span className="text-xs text-volt-text-3">Up to {MAX_COMPARE} ad sets can be compared</span>
        ) : null}
        {selected.length >= 2 ? (
          <Button onClick={() => setCompareOpen(true)}>Compare ({selected.length})</Button>
        ) : null}
      </div>
      <AdSetsTable adSets={rows} selectedIds={selectedIds} onToggle={toggleSelected} clientSlug={clientSlug} />
      <CompareDrawer adSets={selected} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}
