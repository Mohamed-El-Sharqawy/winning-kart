import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { StatusDot, entityStatusVariant, statusWords } from "@/shared/components/StatusDot";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { FATIGUE_FLAG_COPY, type FatigueFlagCopy } from "../data/gallery-copy.data";
import { useAdDetail } from "../services/creatives.service";
import type { GalleryAdDetail } from "../types/creatives.types";
import { CreativeDrawerMedia } from "./CreativeDrawerMedia";

export interface CreativeDrawerProps {
  accountId: string | null;
  adId: string;
  range: DateRange;
  rangeExplicit: boolean;
  onClose: () => void;
}

export function CreativeDrawer({ accountId, adId, range, rangeExplicit, onClose }: CreativeDrawerProps) {
  const { data: detail, isPending, isError } = useAdDetail(accountId, adId, range, rangeExplicit, true);
  const fatigue = detail?.fatigue ? FATIGUE_FLAG_COPY[detail.fatigue.flag] : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside
        data-testid="creative-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={detail?.name ?? "Creative detail"}
        className="absolute inset-y-0 right-0 flex w-130 max-w-full flex-col border-l border-volt-border bg-volt-surface"
      >
        <header className="flex items-start justify-between gap-4 border-b border-volt-border px-5 py-4">
          {isPending ? (
            <p className="text-sm text-volt-text-3">Loading creative…</p>
          ) : isError || detail === undefined ? (
            <p className="text-sm text-volt-down">The creative failed to load.</p>
          ) : (
            <DrawerHeading detail={detail} fatigue={fatigue} />
          )}
          <button
            type="button"
            data-testid="drawer-close"
            aria-label="Close drawer"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-wk border border-volt-border px-3 py-1.5 text-[13px] text-volt-text-2 hover:text-volt-text"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isPending ? (
            <div className="aspect-video w-full animate-pulse rounded-wk bg-volt-surface-2" />
          ) : isError || detail === undefined ? null : (
            <DrawerBody detail={detail} fatigue={fatigue} />
          )}
        </div>
        {detail !== undefined && !isError ? (
          <footer className="flex justify-end border-t border-volt-border px-5 py-4">
            <a
              data-testid="ads-manager-link"
              href={detail.adsManagerUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-wk bg-volt-primary px-4 py-2 text-sm font-medium text-volt-ground"
            >
              Open in Ads Manager
            </a>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function DrawerHeading({ detail, fatigue }: { detail: GalleryAdDetail; fatigue: FatigueFlagCopy | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="truncate text-base font-semibold text-volt-text" title={detail.name}>
        {detail.name}
      </p>
      <p className="truncate text-[13px] text-volt-text-3" title={`${detail.campaignName} · ${detail.adSetName}`}>
        {detail.campaignName} · {detail.adSetName}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-volt-border px-2 py-0.5 text-[11px] text-volt-text-2">
          <StatusDot variant={entityStatusVariant(detail.status)} />
          {statusWords(detail.status)}
        </span>
        {fatigue ? <Badge variant={fatigue.badgeVariant}>{fatigue.label}</Badge> : null}
      </div>
    </div>
  );
}

function DrawerBody({ detail, fatigue }: { detail: GalleryAdDetail; fatigue: FatigueFlagCopy | null }) {
  return (
    <div className="flex flex-col gap-4">
      <CreativeDrawerMedia detail={detail} />
      {detail.bodyCopy !== null ? (
        <p className="text-[13px] leading-relaxed text-volt-text-2">{detail.bodyCopy}</p>
      ) : null}
      {fatigue && detail.fatigue ? (
        <p className="text-[13px] text-volt-text-3">
          {fatigue.label}: {detail.fatigue.reason}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-3">
        <Metric label="Spend" value={formatAed(detail.spend)} />
        <Metric label="Revenue" value={formatAed(detail.revenue)} />
        <Metric
          label="ROAS"
          value={<span className={cn("font-semibold", roasTone(detail.roas))}>{formatRoas(detail.roas)}</span>}
        />
        <Metric label="CTR" value={formatPct(detail.ctr)} />
        <Metric label="Frequency" value={formatDecimal(detail.frequency)} />
        <Metric label="Purchases" value={formatNumber(detail.purchases)} />
        <Metric label="CPA" value={formatAed(detail.cpa)} />
        <Metric label="Spend share" value={spendShareLabel(detail.spendShare)} />
      </dl>
    </div>
  );
}

function spendShareLabel(spendShare: number | null): string {
  if (spendShare === null || !Number.isFinite(spendShare)) return "—";
  return `${Math.round(spendShare * 100)}%`;
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-wk border border-volt-border bg-volt-surface-2 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-volt-text-3">{label}</dt>
      <dd className="tabular text-sm text-volt-text">{value}</dd>
    </div>
  );
}
