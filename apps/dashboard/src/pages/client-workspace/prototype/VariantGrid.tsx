import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatPct, formatRoas, roasTone } from "@/lib/format";
import { StatusDot } from "@/shared/components/StatusDot";
import { videoFallback } from "./mock-media";
import {
  STATUS_KEYS,
  STATUS_LABELS,
  STATUS_META,
  filterCreatives,
  type ProtoCreative,
  type ProtoFormat,
  type ProtoSortKey,
  type ProtoStatusFilter,
} from "./mock-creatives";
import { VariantGridModal } from "./VariantGridModal";

const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";
const SORT_LABELS: Record<ProtoSortKey, string> = { spend: "Spend", roas: "ROAS", ctr: "CTR", frequency: "Frequency" };
const PAGE_SIZE = 24;

export function VariantGrid() {
  const [status, setStatus] = useState<ProtoStatusFilter>("active");
  const [format, setFormat] = useState<"all" | ProtoFormat>("all");
  const [sort, setSort] = useState<ProtoSortKey>("spend");
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<ProtoCreative | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => filterCreatives({ status, format, sort }), [status, format, sort]);
  const visible = filtered.slice(0, pages * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  useEffect(() => {
    setPages(1);
  }, [status, format, sort]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (node === null || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setPages((current) => current + 1);
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as ProtoStatusFilter)} className={SELECT_CLASS}>
            <option value="all">{STATUS_LABELS.all}</option>
            <option value="active">{STATUS_LABELS.active}</option>
            <option value="inactive">{STATUS_LABELS.inactive}</option>
            <optgroup label="Exact status">
              {STATUS_KEYS.map((key) => (
                <option key={key} value={key}>{STATUS_META[key].label}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Format
          <select value={format} onChange={(event) => setFormat(event.target.value as "all" | ProtoFormat)} className={SELECT_CLASS}>
            <option value="all">All</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="CAROUSEL">Carousel</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as ProtoSortKey)} className={SELECT_CLASS}>
            {(Object.keys(SORT_LABELS) as ProtoSortKey[]).map((key) => (
              <option key={key} value={key}>{SORT_LABELS[key]}</option>
            ))}
          </select>
        </label>
        <span className="text-[13px] text-volt-text-3">{visible.length} of {filtered.length} creatives</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {visible.map((creative) => (
          <GridCard key={creative.id} creative={creative} onSelect={() => setSelected(creative)} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-2" />
      {hasMore ? <p className="text-center text-[13px] text-volt-text-3">Loading more…</p> : null}
      {selected !== null ? (
        <VariantGridModal creative={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function GridCard({ creative, onSelect }: { creative: ProtoCreative; onSelect: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meta = STATUS_META[creative.status];

  function preview(on: boolean) {
    const video = videoRef.current;
    if (video === null) return;
    if (on) video.play().catch(() => undefined);
    else {
      video.pause();
      video.currentTime = 0;
    }
  }

  return (
    <article
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      onMouseEnter={() => preview(true)}
      onMouseLeave={() => preview(false)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-wk border border-volt-border bg-volt-surface transition-colors hover:border-volt-border-2"
    >
      <div className="relative aspect-[4/5] bg-volt-surface-2">
        {creative.format === "VIDEO" && creative.videoUrl !== null ? (
          <GridVideo videoRef={videoRef} creative={creative} />
        ) : (
          <img src={creative.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        {creative.format === "CAROUSEL" ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            1/{creative.cards}
          </span>
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
          {creative.format}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
          <StatusDot variant={meta.dot} />
          {meta.label}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="truncate text-sm font-medium text-volt-text" title={creative.name}>{creative.name}</p>
        <p className="truncate text-xs text-volt-text-3" title={`${creative.campaignName} · ${creative.adSetName}`}>
          {creative.campaignName} · {creative.adSetName}
        </p>
        <dl className="grid grid-cols-4 gap-x-2 gap-y-1">
          <Metric label="ROAS" value={<span className={cn("font-semibold", roasTone(creative.roas))}>{formatRoas(creative.roas)}</span>} />
          <Metric label="Spend" value={formatAed(creative.spend)} />
          <Metric label="Freq" value={formatDecimal(creative.frequency)} />
          <Metric label="CTR" value={formatPct(creative.ctr)} />
        </dl>
        {creative.fatigue ? (
          <p className="text-[11px] text-volt-text-3">{creative.fatigue.flag}: {creative.fatigue.reason}</p>
        ) : null}
      </div>
    </article>
  );
}

function GridVideo({ videoRef, creative }: { videoRef: RefObject<HTMLVideoElement | null>; creative: ProtoCreative }) {
  const [source, setSource] = useState(creative.videoUrl);
  return (
    <video
      ref={videoRef}
      src={source ?? undefined}
      poster={creative.thumb}
      muted
      loop
      playsInline
      preload="none"
      onError={() => {
        const fallback = source !== null ? videoFallback(source) : null;
        if (fallback !== null) setSource(fallback);
      }}
      className="h-full w-full object-cover"
    />
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wider text-volt-text-3 uppercase">{label}</dt>
      <dd className="tabular text-[13px] text-volt-text">{value}</dd>
    </div>
  );
}
