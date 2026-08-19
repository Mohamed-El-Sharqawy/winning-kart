import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { Modal } from "@/shared/components/Modal";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import { FATIGUE_FLAG_COPY } from "../data/gallery-copy.data";
import type { Creative } from "../types/creatives.types";

const DASH = "—";

const GHOST_ANCHOR_CLASS =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text";

const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
  deleted: "neutral",
};

function statusVariant(status: string | null | undefined): StatusDotVariant {
  if (status === null || status === undefined) return "neutral";
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

function humanize(value: string | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLowerCase().replace(/_/g, " ");
}

function MetricCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wider text-volt-text-3">{label}</dt>
      <dd className={cn("tabular text-[13px] text-volt-text", tone)}>{value}</dd>
    </div>
  );
}

export interface CreativeDetailModalProps {
  creative: Creative;
  actId: string | null;
  onClose: () => void;
}

export function CreativeDetailModal({ creative, actId, onClose }: CreativeDetailModalProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = creative.thumbnailUrl !== null && !imageFailed;
  const isVideo = creative.format.toUpperCase() === "VIDEO";
  const formatLabel = creative.format === "" ? "CREATIVE" : creative.format;
  const share = creative.spendShare === null ? null : `${Math.round(creative.spendShare * 100)}%`;
  const fatigue = creative.fatigue ? FATIGUE_FLAG_COPY[creative.fatigue.flag] : null;
  const adsManagerUrl =
    actId !== null && actId !== "" && creative.platformAdId !== ""
      ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_ad_ids=${creative.platformAdId}`
      : null;

  return (
    <Modal title={creative.name} onClose={onClose} width="lg">
      <div className="flex flex-col gap-4">
        <div className="relative flex items-center justify-center overflow-hidden rounded-[10px] bg-volt-surface-2">
          {showImage ? (
            <img
              src={creative.thumbnailUrl ?? undefined}
              alt=""
              onError={() => setImageFailed(true)}
              className="max-h-[360px] w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center text-sm text-volt-text-3">
              {formatLabel}
            </div>
          )}
          {isVideo && showImage ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Badge>VIDEO</Badge>
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-volt-text">{creative.name}</span>
            <StatusDot variant={statusVariant(creative.status)}>{humanize(creative.status)}</StatusDot>
            <Badge>{formatLabel}</Badge>
          </div>
          <p className="truncate text-xs text-volt-text-3">
            {creative.campaignName} · {creative.adSetName}
          </p>
        </div>
        {creative.bodyCopy !== null && creative.bodyCopy !== "" ? (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-volt-text-3">Ad copy</span>
            <blockquote className="border-l border-volt-border pl-3 text-sm text-volt-text-2">
              {creative.bodyCopy}
            </blockquote>
          </div>
        ) : null}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <MetricCell label="Spend" value={formatAed(creative.spend)} />
          <MetricCell label="Revenue" value={formatAed(creative.revenue)} />
          <MetricCell label="ROAS" value={formatRoas(creative.roas)} tone={roasTone(creative.roas)} />
          <MetricCell label="CPA" value={formatAed(creative.cpa)} />
          <MetricCell label="Purchases" value={formatNumber(creative.purchases)} />
          <MetricCell label="CTR" value={formatPct(creative.ctr)} />
          <MetricCell label="Frequency" value={formatDecimal(creative.frequency)} />
          <MetricCell label="Spend share" value={share ?? DASH} />
        </dl>
        {creative.fatigue && fatigue ? (
          <div className="flex items-start gap-2 rounded-[10px] border border-volt-border bg-volt-surface-2 px-3 py-2">
            <Badge variant={fatigue.badgeVariant}>{fatigue.label}</Badge>
            <span className="text-xs text-volt-text-3">{creative.fatigue.reason}</span>
          </div>
        ) : null}
        {adsManagerUrl !== null ? (
          <div className="flex justify-end border-t border-volt-border pt-4">
            <a href={adsManagerUrl} target="_blank" rel="noreferrer" className={GHOST_ANCHOR_CLASS}>
              Open in Ads Manager
            </a>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
