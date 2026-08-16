import { useState } from "react";
import { Badge } from "@/shared/components/Badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { FATIGUE_FLAG_COPY, FATIGUE_FLAG_ORDER } from "../data/gallery-copy.data";
import { useCreatives, useFatigueSummary } from "../services/creatives.service";
import type { FatigueFlag } from "../types/creatives.types";
import { CreativesGallery } from "./CreativesGallery";
import { SkeletonRows } from "./SkeletonRows";

const SELECT_CLASS =
  "rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

const COUNTED_FLAGS: FatigueFlag[] = ["fatiguing", "bleeding", "scale"];

const SORT_OPTIONS = [
  { id: "spend", label: "Spend" },
  { id: "roas", label: "ROAS" },
  { id: "ctr", label: "CTR" },
  { id: "frequency", label: "Frequency" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["id"];
type FlagFilter = FatigueFlag | "all";

export interface CreativesTabProps {
  accountId: string | null;
  days: number;
  clientSlug: string;
}

function pct(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100);
}

export function CreativesTab({ accountId, days }: CreativesTabProps) {
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const { data: creatives, isPending } = useCreatives(accountId, days);
  const { data: summary } = useFatigueSummary(accountId, days);

  const rows = creatives ?? [];
  const formats = Array.from(new Set(rows.map((row) => row.format)));
  const visible = rows
    .filter((row) => flagFilter === "all" || row.fatigue?.flag === flagFilter)
    .filter((row) => formatFilter === "all" || row.format === formatFilter)
    .sort((a, b) => (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity));

  const concentrationPct =
    summary?.concentration === "top1"
      ? pct(summary.topCreativeSpendShare)
      : summary?.concentration === "top3"
        ? pct(summary.top3SpendShare)
        : null;

  if (isPending) {
    return <SkeletonRows rows={6} columns={4} />;
  }
  if (rows.length === 0) {
    return <EmptyState title="No creatives yet — sync the ad account first" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {summary && summary.concentration !== null && concentrationPct !== null ? (
        <p className="rounded-[10px] border border-volt-border bg-volt-surface px-4 py-3 text-[13px] text-volt-text-2">
          Concentration risk:{" "}
          {summary.concentration === "top1" ? "top creative is" : "top 3 creatives are"} {concentrationPct}% of
          spend
        </p>
      ) : null}
      {summary ? (
        <div className="flex flex-wrap gap-2">
          {COUNTED_FLAGS.map((flag) => (
            <Badge key={flag} variant={FATIGUE_FLAG_COPY[flag].badgeVariant}>
              {FATIGUE_FLAG_COPY[flag].label} {summary.counts[flag]}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Fatigue
          <select
            value={flagFilter}
            onChange={(event) => setFlagFilter(event.target.value as FlagFilter)}
            className={SELECT_CLASS}
          >
            <option value="all">All</option>
            {FATIGUE_FLAG_ORDER.map((flag) => (
              <option key={flag} value={flag}>
                {FATIGUE_FLAG_COPY[flag].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Format
          <select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)} className={SELECT_CLASS}>
            <option value="all">All</option>
            {formats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Sort
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className={SELECT_CLASS}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No creatives match these filters" hint="Adjust the filters to see more creatives." />
      ) : (
        <CreativesGallery creatives={visible} />
      )}
    </div>
  );
}
