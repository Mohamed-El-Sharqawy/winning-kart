import { useMemo } from "react";
import type { GalleryPage } from "../types/creatives.types";
import type { GalleryRowData } from "../components/GalleryTable";

export function useGalleryRows(
  ads: { data?: { pages: GalleryPage[] } },
  thumbOverrides: Record<string, string>,
): GalleryRowData[] {
  return useMemo<GalleryRowData[]>(
    () =>
      (ads.data?.pages ?? []).flatMap((page, pageIndex) =>
        page.items.map((ad) => ({
          rowKey: `${pageIndex}:${ad.id}`,
          ad: thumbOverrides[ad.id] !== undefined ? { ...ad, thumbnailUrl: thumbOverrides[ad.id] } : ad,
        })),
      ),
    [ads.data, thumbOverrides],
  );
}
