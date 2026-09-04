import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { StatusDot } from "@/shared/components/StatusDot";
import {
  STATUS_KEYS,
  STATUS_META,
  filterCreatives,
  type ProtoCreative,
  type ProtoFormat,
  type ProtoSortKey,
  type ProtoStatusFilter,
} from "./mock-creatives";
import { VariantTableDrawer } from "./VariantTableDrawer";

const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";
const COLUMNS: { key: ProtoSortKey | "name" | "status" | "purchases"; label: string; sortable: boolean }[] = [
  { key: "name", label: "Creative", sortable: false },
  { key: "status", label: "Status", sortable: false },
  { key: "spend", label: "Spend", sortable: true },
  { key: "roas", label: "ROAS", sortable: true },
  { key: "ctr", label: "CTR", sortable: true },
  { key: "frequency", label: "Freq", sortable: true },
  { key: "purchases", label: "Purchases", sortable: false },
];
const PAGE_SIZE = 30;

export function VariantTable() {
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
      <div className="flex flex-wrap items-center gap-3">
        {(["all", "active", "inactive"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px]",
              status === key
                ? "border-volt-primary bg-volt-surface-2 font-medium text-volt-text"
                : "border-volt-border text-volt-text-2 hover:text-volt-text",
            )}
          >
            {key === "all" ? "All" : key === "active" ? "Active" : "Inactive"}
          </button>
        ))}
        <select
          value={typeof status === "string" && !["all", "active", "inactive"].includes(status) ? status : ""}
          onChange={(event) => {
            if (event.target.value !== "") setStatus(event.target.value as ProtoStatusFilter);
          }}
          className={SELECT_CLASS}
        >
          <option value="">Exact status…</option>
          {STATUS_KEYS.map((key) => (
            <option key={key} value={key}>{STATUS_META[key].label}</option>
          ))}
        </select>
        <select value={format} onChange={(event) => setFormat(event.target.value as "all" | ProtoFormat)} className={SELECT_CLASS}>
          <option value="all">All formats</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
          <option value="CAROUSEL">Carousel</option>
        </select>
        <span className="text-[13px] text-volt-text-3">{visible.length} of {filtered.length}</span>
      </div>
      <div className="overflow-x-auto rounded-wk border border-volt-border bg-volt-surface">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-volt-border text-[11px] tracking-wider text-volt-text-3 uppercase">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => setSort(column.key as ProtoSortKey)}
                      className={cn("flex items-center gap-1", sort === column.key ? "text-volt-text" : "hover:text-volt-text")}
                    >
                      {column.label}
                      {sort === column.key ? <span aria-hidden>↓</span> : null}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((creative) => (
              <TableRow key={creative.id} creative={creative} onSelect={() => setSelected(creative)} />
            ))}
          </tbody>
        </table>
      </div>
      <div ref={sentinelRef} className="h-2" />
      {hasMore ? <p className="text-center text-[13px] text-volt-text-3">Loading more…</p> : null}
      {selected !== null ? <VariantTableDrawer creative={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function TableRow({ creative, onSelect }: { creative: ProtoCreative; onSelect: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meta = STATUS_META[creative.status];
  return (
    <tr
      onClick={onSelect}
      className="cursor-pointer border-b border-volt-border last:border-b-0 hover:bg-volt-surface-2"
      onMouseEnter={() => videoRef.current?.play().catch(() => undefined)}
      onMouseLeave={() => {
        const video = videoRef.current;
        if (video !== null) {
          video.pause();
          video.currentTime = 0;
        }
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-wk bg-volt-surface-2">
            {creative.format === "VIDEO" && creative.videoUrl !== null ? (
              <video
                ref={videoRef}
                src={creative.videoUrl}
                poster={creative.thumb}
                muted
                loop
                playsInline
                preload="none"
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={creative.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-volt-text" title={creative.name}>{creative.name}</p>
            <p className="truncate text-xs text-volt-text-3" title={`${creative.campaignName} · ${creative.adSetName}`}>
              {creative.campaignName} · {creative.adSetName} · {creative.format}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5 text-volt-text-2">
          <StatusDot variant={meta.dot} />
          {meta.label}
        </span>
      </td>
      <td className="tabular px-4 py-3 text-volt-text">{formatAed(creative.spend)}</td>
      <td className={cn("tabular px-4 py-3 font-semibold", roasTone(creative.roas))}>{formatRoas(creative.roas)}</td>
      <td className="tabular px-4 py-3 text-volt-text">{formatPct(creative.ctr)}</td>
      <td className="tabular px-4 py-3 text-volt-text">{formatDecimal(creative.frequency)}</td>
      <td className="tabular px-4 py-3 text-volt-text">{formatNumber(creative.purchases)}</td>
    </tr>
  );
}
