import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatRoas } from "@/lib/format";
import { StatusDot } from "@/shared/components/StatusDot";
import {
  STATUS_META,
  filterCreatives,
  type ProtoCreative,
  type ProtoFormat,
  type ProtoSortKey,
  type ProtoStatusFilter,
} from "./mock-creatives";
import { VariantLightbox } from "./VariantLightbox";

const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";
const SORT_LABELS: Record<ProtoSortKey, string> = { spend: "Spend", roas: "ROAS", ctr: "CTR", frequency: "Frequency" };
const PAGE_SIZE = 24;

export function VariantMasonry() {
  const [status, setStatus] = useState<ProtoStatusFilter>("active");
  const [format, setFormat] = useState<"all" | ProtoFormat>("all");
  const [sort, setSort] = useState<ProtoSortKey>("spend");
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-wk border border-volt-border bg-volt-surface p-1">
          {(["active", "inactive", "all"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={cn(
                "rounded-wk px-3 py-1.5 text-[13px]",
                status === key ? "bg-volt-surface-2 font-medium text-volt-text" : "text-volt-text-2 hover:text-volt-text",
              )}
            >
              {key === "all" ? "All" : key === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
        <select value={format} onChange={(event) => setFormat(event.target.value as "all" | ProtoFormat)} className={SELECT_CLASS}>
          <option value="all">All formats</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
          <option value="CAROUSEL">Carousel</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as ProtoSortKey)} className={SELECT_CLASS}>
          {(Object.keys(SORT_LABELS) as ProtoSortKey[]).map((key) => (
            <option key={key} value={key}>{SORT_LABELS[key]}</option>
          ))}
        </select>
        <span className="text-[13px] text-volt-text-3">{visible.length} of {filtered.length}</span>
      </div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {visible.map((creative, index) => (
          <MasonryCard key={creative.id} creative={creative} onSelect={() => setSelected(index)} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-2" />
      {hasMore ? <p className="text-center text-[13px] text-volt-text-3">Loading more…</p> : null}
      {selected !== null && visible[selected] !== undefined ? (
        <VariantLightbox creatives={visible} index={selected} onIndexChange={setSelected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function MasonryCard({ creative, onSelect }: { creative: ProtoCreative; onSelect: () => void }) {
  const meta = STATUS_META[creative.status];
  const aspect = creative.format === "VIDEO" ? "aspect-[9/16]" : creative.format === "CAROUSEL" ? "aspect-square" : "aspect-[4/5]";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("group mb-4 block w-full break-inside-avoid overflow-hidden rounded-wk border border-volt-border bg-volt-surface text-left", aspect)}
    >
      <div className={cn("relative h-full w-full bg-volt-surface-2", aspect)}>
        {creative.format === "VIDEO" && creative.videoUrl !== null ? (
          <video src={creative.videoUrl} poster={creative.thumb} muted loop playsInline preload="none" className="h-full w-full object-cover" />
        ) : (
          <img src={creative.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
          {creative.format === "CAROUSEL" ? `1/${creative.cards}` : creative.format}
        </span>
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-white">
          <StatusDot variant={meta.dot} />
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="truncate text-[13px] font-medium text-white">{creative.name}</p>
          <p className="tabular text-xs text-white/80">
            {formatAed(creative.spend)} · {formatRoas(creative.roas)} ROAS
          </p>
        </div>
      </div>
    </button>
  );
}
