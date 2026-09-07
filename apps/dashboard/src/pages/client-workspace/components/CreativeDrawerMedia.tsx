import type { GalleryAdDetail } from "../types/creatives.types";

export interface CreativeDrawerMediaProps {
  detail: GalleryAdDetail;
}

export function CreativeDrawerMedia({ detail }: CreativeDrawerMediaProps) {
  const format = (detail.format ?? "IMAGE").toUpperCase();
  const poster = detail.posterUrl ?? detail.thumbnailUrl;

  if (format === "VIDEO") {
    if (detail.embedUrl !== null) {
      return (
        <iframe
          data-testid="drawer-video-embed"
          src={`${detail.embedUrl}${detail.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
          title={`${detail.name} video player`}
          className="aspect-video w-full rounded-wk border-0 bg-black"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }
    if (detail.sourceUrl !== null) {
      return (
        <video
          controls
          autoPlay
          poster={poster ?? undefined}
          src={detail.sourceUrl}
          className="aspect-video w-full rounded-wk bg-black"
        />
      );
    }
    return <PosterFallback poster={poster} note="This video has no playable source yet." />;
  }

  return (
    <div className="relative">
      {poster !== null ? (
        <img src={poster} alt="" className="max-h-[60vh] w-full rounded-wk object-contain" />
      ) : (
        <div className="flex aspect-[4/5] w-full items-center justify-center rounded-wk bg-volt-surface-2 text-[11px] uppercase tracking-wider text-volt-text-3">
          {format}
        </div>
      )}
      {format === "CAROUSEL" && detail.carouselCount !== null ? (
        <span
          data-testid="drawer-carousel-chip"
          className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white"
        >
          Lead card of {detail.carouselCount}
        </span>
      ) : null}
    </div>
  );
}

function PosterFallback({ poster, note }: { poster: string | null; note: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex aspect-video w-full items-center justify-center rounded-wk bg-black">
        {poster !== null ? (
          <img src={poster} alt="" className="h-full w-full object-contain opacity-60" />
        ) : null}
      </div>
      <p className="text-[13px] text-volt-text-3">{note}</p>
    </div>
  );
}
