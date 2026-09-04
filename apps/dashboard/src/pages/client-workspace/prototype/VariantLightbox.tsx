import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { StatusDot } from "@/shared/components/StatusDot";
import { videoFallback } from "./mock-media";
import { STATUS_META, adsManagerUrl, type ProtoCreative } from "./mock-creatives";

export function VariantLightbox({
  creatives,
  index,
  onIndexChange,
  onClose,
}: {
  creatives: ProtoCreative[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const creative = creatives[index];
  const meta = STATUS_META[creative.status];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (event.key === "ArrowRight" && index < creatives.length - 1) onIndexChange(index + 1);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, creatives.length, onIndexChange, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-6" onClick={onClose}>
      <div className="flex items-center justify-between text-white/80">
        <p className="text-[13px]">
          {index + 1} / {creatives.length} — {creative.name}
        </p>
        <button type="button" onClick={onClose} className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/80">
          Close
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={() => onIndexChange(Math.max(0, index - 1))}
          disabled={index === 0}
          className="rounded-full border border-white/30 px-3 py-2 text-sm text-white/80 disabled:opacity-30"
        >
          Prev
        </button>
        <div className="flex h-full max-h-[70vh] flex-col items-center gap-3">
          <LightboxMedia creative={creative} />
          <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-white/85">
            <span className="flex items-center gap-1.5">
              <StatusDot variant={meta.dot} />
              {meta.label}
            </span>
            <span className="tabular">{formatAed(creative.spend)}</span>
            <span className={cn("tabular font-semibold", roasTone(creative.roas))}>{formatRoas(creative.roas)} ROAS</span>
            <span className="tabular">{formatPct(creative.ctr)} CTR</span>
            <span className="tabular">{formatDecimal(creative.frequency)} freq</span>
            <span className="tabular">{formatNumber(creative.purchases)} purchases</span>
            {creative.fatigue ? <span className="rounded-full bg-white/15 px-2 py-0.5">{creative.fatigue.flag}</span> : null}
            <a
              href={adsManagerUrl(creative)}
              target="_blank"
              rel="noreferrer"
              className="rounded-wk bg-white px-3 py-1 text-[13px] font-medium text-black"
            >
              Ads Manager
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onIndexChange(Math.min(creatives.length - 1, index + 1))}
          disabled={index === creatives.length - 1}
          className="rounded-full border border-white/30 px-3 py-2 text-sm text-white/80 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function LightboxMedia({ creative }: { creative: ProtoCreative }) {
  const [source, setSource] = useState(creative.videoUrl);
  if (creative.format === "VIDEO" && source !== null) {
    return (
      <video
        key={creative.id}
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
        className="max-h-[55vh] rounded-wk bg-black object-contain"
      />
    );
  }
  return (
    <div className="relative">
      <img key={creative.id} src={creative.thumb} alt="" className="max-h-[55vh] rounded-wk object-contain" />
      {creative.format === "CAROUSEL" ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
          Lead card of {creative.cards}
        </span>
      ) : null}
    </div>
  );
}
