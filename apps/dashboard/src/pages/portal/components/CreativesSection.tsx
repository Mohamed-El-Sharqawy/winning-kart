import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatRoas, roasTone } from "@/lib/format";
import { EmptyState } from "@/shared/components/EmptyState";
import type { PortalCreative } from "../types/portal.types";

function CreativeThumb({ creative }: { creative: PortalCreative }) {
  const [failed, setFailed] = useState(false);
  if (!creative.thumbnailUrl || failed) {
    return (
      <div
        aria-hidden
        className="flex h-[120px] w-full items-center justify-center rounded-[8px] border border-volt-border bg-volt-surface-2 text-[10px] font-medium uppercase tracking-wider text-volt-text-3"
      >
        {creative.format.replace(/_/g, " ")}
      </div>
    );
  }
  return (
    <img
      src={creative.thumbnailUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-[120px] w-full rounded-[8px] border border-volt-border object-cover"
    />
  );
}

export interface CreativesSectionProps {
  creatives: PortalCreative[];
}

export function CreativesSection({ creatives }: CreativesSectionProps) {
  if (creatives.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-volt-text">Your creatives</h2>
        <EmptyState title="No creatives yet" hint="Your ads appear here once campaigns are live." />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-volt-text">Your creatives</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {creatives.map((creative) => (
          <div key={creative.id} className="w-40 shrink-0 rounded-[10px] border border-volt-border bg-volt-surface p-3">
            <CreativeThumb creative={creative} />
            <p className="mt-2 truncate text-sm font-medium text-volt-text" title={creative.name}>
              {creative.name}
            </p>
            <div className="tabular mt-1.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-volt-text-2">{formatAed(creative.spend)}</span>
              <span className={cn("shrink-0", roasTone(creative.roas))}>{formatRoas(creative.roas)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
