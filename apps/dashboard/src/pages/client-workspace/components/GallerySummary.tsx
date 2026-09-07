import { Badge } from "@/shared/components/Badge";
import { FATIGUE_FLAG_COPY } from "../data/gallery-copy.data";
import type { FatigueSummary } from "../types/creatives.types";

const COUNTED_FLAGS = ["fatiguing", "bleeding", "scale"] as const;

export function GallerySummary({ summary }: { summary: FatigueSummary }) {
  const concentrationRaw =
    summary.concentration === null
      ? null
      : summary.concentration === "top1"
        ? summary.topCreativeSpendShare
        : summary.top3SpendShare;
  const concentrationPct = concentrationRaw === null ? null : Math.round(concentrationRaw * 100);

  return (
    <>
      {summary.concentration !== null && concentrationPct !== null ? (
        <p className="rounded-wk border border-volt-border bg-volt-surface px-4 py-3 text-[13px] text-volt-text-2">
          Concentration risk: {summary.concentration === "top1" ? "top creative is" : "top 3 creatives are"}{" "}
          {concentrationPct}% of spend
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {COUNTED_FLAGS.map((flag) => (
          <Badge key={flag} variant={FATIGUE_FLAG_COPY[flag].badgeVariant}>
            {FATIGUE_FLAG_COPY[flag].label} {summary.counts[flag]}
          </Badge>
        ))}
      </div>
    </>
  );
}
