import type { AdFormat } from "@wk/db";
import { MEDIA_IDS_BATCH_MAX } from "../../platforms/meta";
import type { AdPlatformAdapter } from "../../platforms/meta";
import type { AdAccountsModel, AdMediaPatch } from "./model";

const DAY_MS = 86400000;
const TTL_DAYS_DEFAULT = 7;
const TTL_DAYS_MIN = 1;
const TTL_DAYS_MAX = 30;

export function mediaUrlTtlDays(): number {
  const parsed = Number.parseInt(process.env.WK_MEDIA_URL_TTL_DAYS ?? "", 10);
  const value = Number.isFinite(parsed) ? parsed : TTL_DAYS_DEFAULT;
  return Math.min(Math.max(value, TTL_DAYS_MIN), TTL_DAYS_MAX);
}

export function isMediaStale(
  url: string | null,
  resolvedAt: Date | null,
  now: Date,
  ttlDays: number
): boolean {
  if (url === null || resolvedAt === null) {
    return true;
  }
  return now.getTime() - resolvedAt.getTime() >= ttlDays * DAY_MS;
}

export type MediaResolverModel = Pick<AdAccountsModel, "findAdsMediaByIds" | "updateAdMedia">;

export type MediaResolverAdapter = Pick<AdPlatformAdapter, "getAdsByIds" | "getVideoMedia">;

export interface ResolvedMediaItem {
  adId: string;
  format: AdFormat | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
}

export async function resolveAdMedia(
  model: MediaResolverModel,
  account: { id: string },
  adapter: MediaResolverAdapter,
  ids: string[],
  force: boolean
): Promise<ResolvedMediaItem[]> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return [];
  }
  const rows = await model.findAdsMediaByIds(account.id, uniqueIds);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const rowByPlatformId = new Map(rows.map((row) => [row.platformAdId, row]));
  const now = new Date();
  const ttlDays = mediaUrlTtlDays();
  const patches = new Map<string, AdMediaPatch>();

  const staleThumbnails = rows.filter(
    (row) => force || isMediaStale(row.thumbnailUrl, row.thumbnailResolvedAt, now, ttlDays)
  );
  for (let index = 0; index < staleThumbnails.length; index += MEDIA_IDS_BATCH_MAX) {
    const chunk = staleThumbnails.slice(index, index + MEDIA_IDS_BATCH_MAX);
    const graphRows = await adapter.getAdsByIds(chunk.map((row) => row.platformAdId));
    for (const graphRow of graphRows) {
      const row = rowByPlatformId.get(graphRow.id);
      const thumbnailUrl = graphRow.creative?.thumbnail_url ?? null;
      if (row === undefined || thumbnailUrl === null) {
        continue;
      }
      patches.set(row.id, { ...patches.get(row.id), thumbnailUrl, thumbnailResolvedAt: now });
    }
  }

  const staleVideos = rows.filter(
    (row) =>
      row.videoId !== null &&
      (force ||
        isMediaStale(row.posterUrl, row.posterResolvedAt, now, ttlDays) ||
        isMediaStale(row.sourceUrl, row.sourceResolvedAt, now, ttlDays))
  );
  const videoIds = [...new Set(staleVideos.map((row) => row.videoId as string))];
  for (const videoId of videoIds) {
    const media = await adapter.getVideoMedia(videoId);
    if (media === null) {
      continue;
    }
    for (const row of staleVideos) {
      if (row.videoId !== videoId) {
        continue;
      }
      const patch: AdMediaPatch = { ...patches.get(row.id) };
      if (media.picture !== undefined) {
        patch.posterUrl = media.picture;
        patch.posterResolvedAt = now;
      }
      if (media.source !== undefined) {
        patch.sourceUrl = media.source;
        patch.sourceResolvedAt = now;
      }
      patches.set(row.id, patch);
    }
  }

  for (const [adId, patch] of patches) {
    if (Object.keys(patch).length > 0) {
      await model.updateAdMedia(adId, patch);
    }
  }

  return uniqueIds.flatMap((adId) => {
    const row = rowById.get(adId);
    if (row === undefined) {
      return [];
    }
    const patch = patches.get(adId);
    return [
      {
        adId,
        format: row.format,
        thumbnailUrl: patch?.thumbnailUrl ?? row.thumbnailUrl,
        videoId: row.videoId,
        carouselCount: row.carouselCount,
      },
    ];
  });
}
