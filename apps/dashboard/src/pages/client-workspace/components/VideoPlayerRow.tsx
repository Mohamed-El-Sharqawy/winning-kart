import type { DateRange } from "@/shared/components/DateRangeControl";
import { useAdDetail } from "../services/creatives.service";
import type { GalleryAd } from "../types/creatives.types";

export interface VideoPlayerRowProps {
  ad: GalleryAd;
  colSpan: number;
  accountId: string | null;
  range: DateRange;
  rangeExplicit: boolean;
  onClose: () => void;
}

export function VideoPlayerRow({ ad, colSpan, accountId, range, rangeExplicit, onClose }: VideoPlayerRowProps) {
  const { data: detail, isPending, isError } = useAdDetail(accountId, ad.id, range, rangeExplicit, true);

  return (
    <tr data-testid="video-player-row">
      <td colSpan={colSpan} className="border-b border-volt-border bg-volt-surface-2 px-4 py-3">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-medium text-volt-text">{ad.name}</span>
          <button
            type="button"
            aria-label="Close player"
            onClick={onClose}
            className="cursor-pointer text-volt-text-3 transition-colors hover:text-volt-text"
          >
            ×
          </button>
        </div>
        {isPending ? <p className="text-sm text-volt-text-3">Loading player…</p> : null}
        {isError ? <p className="text-sm text-volt-down">The player failed to load.</p> : null}
        {detail !== undefined && detail.embedUrl !== null ? (
          <iframe
            src={`${detail.embedUrl}${detail.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            title={`${ad.name} video player`}
            className="aspect-video w-full max-w-2xl rounded-wk border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : null}
        {detail !== undefined && detail.embedUrl === null && detail.sourceUrl !== null ? (
          <video controls autoPlay src={detail.sourceUrl} className="aspect-video w-full max-w-2xl rounded-wk bg-black" />
        ) : null}
        {detail !== undefined && detail.embedUrl === null && detail.sourceUrl === null && !isPending && !isError ? (
          <p className="text-sm text-volt-text-3">This video has no playable source yet.</p>
        ) : null}
      </td>
    </tr>
  );
}
