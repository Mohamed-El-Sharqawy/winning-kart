import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { StatusDot } from "@/shared/components/StatusDot";
import { videoFallback } from "./mock-media";
import { STATUS_META, adsManagerUrl, type ProtoCreative } from "./mock-creatives";

const FATIGUE_BADGE: Record<string, "down" | "up" | "neutral"> = {
  fatiguing: "neutral",
  bleeding: "down",
  scale: "up",
};

export function VariantGridModal({ creative, onClose }: { creative: ProtoCreative; onClose: () => void }) {
  const meta = STATUS_META[creative.status];
  const share = `${Math.round(creative.spendShare * 100)}%`;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-wk border border-volt-border bg-volt-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-volt-text">{creative.name}</p>
            <p className="text-[13px] text-volt-text-3">{creative.campaignName} · {creative.adSetName}</p>
            <span className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-volt-border px-2 py-0.5 text-[11px] text-volt-text-2">
              <StatusDot variant={meta.dot} />
              {meta.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-wk border border-volt-border px-3 py-1.5 text-[13px] text-volt-text-2 hover:text-volt-text"
          >
            Close
          </button>
        </div>
        <ModalMedia creative={creative} />
        {creative.fatigue ? (
          <div className="flex items-center gap-2">
            <Badge variant={FATIGUE_BADGE[creative.fatigue.flag] ?? "warning"}>{creative.fatigue.flag}</Badge>
            <span className="text-[13px] text-volt-text-3">{creative.fatigue.reason}</span>
          </div>
        ) : null}
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Spend" value={formatAed(creative.spend)} />
          <Metric label="Revenue" value={formatAed(creative.revenue)} />
          <Metric label="ROAS" value={<span className={cn("font-semibold", roasTone(creative.roas))}>{formatRoas(creative.roas)}</span>} />
          <Metric label="CTR" value={formatPct(creative.ctr)} />
          <Metric label="Frequency" value={formatDecimal(creative.frequency)} />
          <Metric label="Purchases" value={formatNumber(creative.purchases)} />
          <Metric label="CPA" value={formatAed(creative.cpa)} />
          <Metric label="Spend share" value={share} />
        </dl>
        <div className="flex justify-end">
          <a
            href={adsManagerUrl(creative)}
            target="_blank"
            rel="noreferrer"
            className="rounded-wk bg-volt-primary px-4 py-2 text-sm font-medium text-volt-ground"
          >
            Open in Ads Manager
          </a>
        </div>
      </div>
    </div>
  );
}

function ModalMedia({ creative }: { creative: ProtoCreative }) {
  const [source, setSource] = useState(creative.videoUrl);
  if (creative.format === "VIDEO" && source !== null) {
    return (
      <video
        src={source}
        poster={creative.thumb}
        controls
        autoPlay
        muted
        loop
        playsInline
        onError={() => {
          const fallback = videoFallback(source);
          if (fallback !== null) setSource(fallback);
        }}
        className="max-h-[50vh] w-full rounded-wk bg-black object-contain"
      />
    );
  }
  return (
    <div className="relative">
      <img src={creative.thumb} alt="" className="max-h-[50vh] w-full rounded-wk object-contain" />
      {creative.format === "CAROUSEL" ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
          Lead card of {creative.cards}
        </span>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-wk border border-volt-border bg-volt-surface-2 px-3 py-2">
      <dt className="text-[11px] tracking-wider text-volt-text-3 uppercase">{label}</dt>
      <dd className="tabular text-sm text-volt-text">{value}</dd>
    </div>
  );
}
