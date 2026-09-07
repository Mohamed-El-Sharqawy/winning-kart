import { useState } from "react";
import type { GalleryAd } from "../types/creatives.types";

export interface GalleryMediaCellProps {
  ad: GalleryAd;
  thumbnailUrl: string | null;
  onOpen: (adId: string) => void;
  onImageError: (adId: string, failedSrc: string | null) => void;
}

export function GalleryMediaCell({ ad, thumbnailUrl, onOpen, onImageError }: GalleryMediaCellProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const format = (ad.format ?? "image").toUpperCase();
  const isVideo = format === "VIDEO";
  const isCarousel = format === "CAROUSEL";
  const showImage = !isVideo && thumbnailUrl !== null && thumbnailUrl !== failedSrc;

  return (
    <div
      className={`relative h-14 w-11 shrink-0 overflow-hidden rounded-wk ${isVideo ? "bg-black" : "bg-volt-surface-2"}`}
    >
      {isVideo ? (
        <button
          type="button"
          aria-label={`Open ${ad.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(ad.id);
          }}
          className="group flex h-full w-full cursor-pointer items-center justify-center"
        >
          <svg
            viewBox="0 0 12 12"
            aria-hidden
            className="h-3.5 w-3.5 fill-white transition-transform group-hover:scale-125"
          >
            <path d="M3 1.8v8.4L10 6z" />
          </svg>
        </button>
      ) : showImage ? (
        <img
          src={thumbnailUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => {
            setFailedSrc(thumbnailUrl);
            onImageError(ad.id, thumbnailUrl);
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wide text-volt-text-3">
          {format}
        </div>
      )}
      {isCarousel && ad.carouselCount !== null ? (
        <span
          data-testid="carousel-chip"
          className="absolute bottom-0.5 right-0.5 rounded-wk bg-black/70 px-1 py-px text-[9px] font-medium text-white"
        >
          1/{ad.carouselCount}
        </span>
      ) : null}
    </div>
  );
}
