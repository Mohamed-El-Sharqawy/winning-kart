import { cn } from "@/lib/cn";
import { formatAed, formatDecimal, formatNumber, formatPct, formatRoas, roasTone } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { StatusDot, entityStatusVariant, statusWords } from "@/shared/components/StatusDot";
import { FATIGUE_FLAG_COPY } from "../data/gallery-copy.data";
import type { GalleryAd } from "../types/creatives.types";
import { GalleryMediaCell } from "./GalleryMediaCell";

export interface GalleryRowProps {
  ad: GalleryAd;
  rowKey: string;
  onTogglePlay: (rowKey: string) => void;
  onImageError: (adId: string, failedSrc: string | null) => void;
}

export function GalleryRow({ ad, rowKey, onTogglePlay, onImageError }: GalleryRowProps) {
  const fatigue = ad.fatigue ? FATIGUE_FLAG_COPY[ad.fatigue.flag] : null;
  return (
    <tr className="border-b border-volt-border last:border-b-0 hover:bg-volt-surface-2">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <GalleryMediaCell
            ad={ad}
            thumbnailUrl={ad.thumbnailUrl}
            onTogglePlay={() => onTogglePlay(rowKey)}
            onImageError={onImageError}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-volt-text" title={ad.name}>{ad.name}</p>
            <p className="truncate text-xs text-volt-text-3" title={`${ad.campaignName} · ${ad.adSetName}`}>
              {ad.campaignName} · {ad.adSetName}
            </p>
            {ad.fatigue !== null && fatigue ? (
              <span title={ad.fatigue.reason} className="mt-1 inline-flex">
                <Badge variant={fatigue.badgeVariant}>{fatigue.label}</Badge>
              </span>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5 text-volt-text-2">
          <StatusDot variant={entityStatusVariant(ad.status)} />
          {statusWords(ad.status)}
        </span>
      </td>
      <td className="tabular px-4 py-3 text-volt-text">{formatAed(ad.spend)}</td>
      <td className={cn("tabular px-4 py-3 font-semibold", roasTone(ad.roas))}>{formatRoas(ad.roas)}</td>
      <td className="tabular px-4 py-3 text-volt-text">{formatPct(ad.ctr)}</td>
      <td className="tabular px-4 py-3 text-volt-text">{formatDecimal(ad.frequency)}</td>
      <td className="tabular px-4 py-3 text-volt-text">{formatNumber(ad.purchases)}</td>
    </tr>
  );
}
