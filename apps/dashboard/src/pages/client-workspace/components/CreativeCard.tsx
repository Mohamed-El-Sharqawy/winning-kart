import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import { FATIGUE_FLAG_COPY } from "../data/gallery-copy.data";
import type { Creative } from "../types/creatives.types";

const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
  pending: "warning",
  in_review: "warning",
  with_issues: "down",
};

function statusVariant(status: string): StatusDotVariant {
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

function MetricLabel({ children }: { children: string }) {
  return <dt className="text-[11px] uppercase tracking-wider text-volt-text-3">{children}</dt>;
}

export function CreativeCard({ creative, onSelect }: { creative: Creative; onSelect?: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isVideo = creative.format.toUpperCase() === "VIDEO";
  const showImage = !isVideo && creative.thumbnailUrl !== null && !imageFailed;
  const copy = creative.fatigue ? FATIGUE_FLAG_COPY[creative.fatigue.flag] : null;
  const share = creative.spendShare === null ? null : `${Math.round(creative.spendShare * 100)}%`;

  return (
    <article
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        "flex flex-col overflow-hidden rounded-[10px] border border-volt-border bg-volt-surface transition-colors hover:border-volt-border-2",
        onSelect && "cursor-pointer",
      )}
    >
      <div className="relative aspect-[4/5]">
        {showImage ? (
          <img
            src={creative.thumbnailUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-volt-surface-2 text-sm capitalize text-volt-text-3">
            {creative.format}
          </div>
        )}
        <span className="absolute left-3 top-3">
          <Badge>{creative.format}</Badge>
        </span>
        <span className="absolute right-3 top-3">
          <StatusDot variant={statusVariant(creative.status)} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <p className="truncate text-sm font-medium text-volt-text" title={creative.name}>
            {creative.name}
          </p>
          <p className="truncate text-xs text-volt-text-3" title={`${creative.campaignName} · ${creative.adSetName}`}>
            {creative.campaignName} · {creative.adSetName}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-3 gap-y-2">
          <div>
            <MetricLabel>ROAS</MetricLabel>
            <dd className={cn("tabular text-[13px] font-semibold", roasTone(creative.roas))}>
              {formatRoas(creative.roas)}
            </dd>
          </div>
          <div>
            <MetricLabel>Spend</MetricLabel>
            <dd className="tabular text-[13px] text-volt-text">{formatAed(creative.spend)}</dd>
          </div>
          <div>
            <MetricLabel>Freq</MetricLabel>
            <dd
              className={cn(
                "tabular text-[13px]",
                creative.frequency !== null && creative.frequency >= 4 ? "text-volt-down" : "text-volt-text",
              )}
            >
              {formatDecimal(creative.frequency)}
            </dd>
          </div>
          <div>
            <MetricLabel>CTR</MetricLabel>
            <dd className="tabular text-[13px] text-volt-text">{formatPct(creative.ctr)}</dd>
          </div>
          <div>
            <MetricLabel>Purchases</MetricLabel>
            <dd className="tabular text-[13px] text-volt-text">{formatNumber(creative.purchases)}</dd>
          </div>
          <div>
            <MetricLabel>Share</MetricLabel>
            <dd className="tabular text-[13px] text-volt-text">{share ?? "—"}</dd>
          </div>
        </dl>
      </div>
      {creative.fatigue && copy ? (
        <footer className="flex items-center gap-2 border-t border-volt-border px-4 py-2.5">
          <Badge variant={copy.badgeVariant}>{copy.label}</Badge>
          <span className="truncate text-[11px] text-volt-text-3">{creative.fatigue.reason}</span>
        </footer>
      ) : null}
    </article>
  );
}
