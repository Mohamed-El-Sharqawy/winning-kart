import { isMediaStale, mediaUrlTtlDays } from "../ad-accounts/media-resolver";
import type { ResolvedMediaItem } from "../ad-accounts/media-resolver";
import type { AdItem } from "./ads-decoration";

export interface StaleThumbnailRow {
  id: string;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: Date | null;
}

export interface PageRefresher {
  resolve: (ids: string[]) => Promise<ResolvedMediaItem[]>;
}

export function staleThumbnailIds(
  rows: StaleThumbnailRow[],
  now: Date,
  ttlDays: number
): string[] {
  return rows
    .filter((row) => isMediaStale(row.thumbnailUrl, row.thumbnailResolvedAt, now, ttlDays))
    .map((row) => row.id);
}

export async function refreshPageThumbnails(
  refresher: PageRefresher,
  rows: StaleThumbnailRow[],
  now: Date
): Promise<Map<string, string>> {
  const ids = staleThumbnailIds(rows, now, mediaUrlTtlDays());
  if (ids.length === 0) {
    return new Map();
  }
  const items = await refresher.resolve(ids);
  return new Map(
    items
      .filter((item): item is ResolvedMediaItem & { thumbnailUrl: string } => item.thumbnailUrl !== null)
      .map((item) => [item.adId, item.thumbnailUrl])
  );
}

export function applyThumbnailRefresh<T extends Pick<AdItem, "id" | "thumbnailUrl">>(
  items: T[],
  refresh: Map<string, string>
): T[] {
  if (refresh.size === 0) {
    return items;
  }
  return items.map((item) => {
    const thumbnailUrl = refresh.get(item.id);
    return thumbnailUrl === undefined ? item : { ...item, thumbnailUrl };
  });
}
