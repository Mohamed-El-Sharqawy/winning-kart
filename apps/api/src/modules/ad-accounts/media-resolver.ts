import type { AdFormat } from "@wk/db";
import { MEDIA_IDS_BATCH_MAX, MetaError } from "../../platforms/meta";
import type { AdPlatformAdapter, MetaVideoMedia } from "../../platforms/meta";
import type { AdAccountsModel, AdMediaPatch } from "./model";
import { isAttemptStale, isMediaStale, mediaUrlTtlDays } from "./media-freshness";

export type MediaResolverModel = Pick<AdAccountsModel, "findAdsMediaByIds" | "updateAdMedia">;

export type MediaResolverAdapter = Pick<AdPlatformAdapter, "getAdsByIds" | "getVideoMedia">;

export interface ResolvedMediaItem {
  adId: string;
  format: AdFormat | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
  posterUrl: string | null;
  sourceUrl: string | null;
}

export type MediaResolveItem = Pick<
  ResolvedMediaItem,
  "adId" | "format" | "thumbnailUrl" | "videoId" | "carouselCount"
>;

export function toMediaResolveItem(item: ResolvedMediaItem): MediaResolveItem {
  return {
    adId: item.adId,
    format: item.format,
    thumbnailUrl: item.thumbnailUrl,
    videoId: item.videoId,
    carouselCount: item.carouselCount,
  };
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

  const staleCreativeReads = rows.filter(
    (row) =>
      force ||
      isMediaStale(row.thumbnailUrl, row.thumbnailResolvedAt, now, ttlDays) ||
      isAttemptStale(row.imageResolvedAt, now, ttlDays)
  );
  for (let index = 0; index < staleCreativeReads.length; index += MEDIA_IDS_BATCH_MAX) {
    const chunk = staleCreativeReads.slice(index, index + MEDIA_IDS_BATCH_MAX);
    const graphRows = await adapter.getAdsByIds(chunk.map((row) => row.platformAdId));
    for (const graphRow of graphRows) {
      const row = rowByPlatformId.get(graphRow.id);
      const thumbnailUrl = graphRow.creative?.thumbnail_url ?? null;
      const imageUrl = graphRow.creative?.image_url ?? null;
      if (row === undefined || (thumbnailUrl === null && imageUrl === null)) {
        continue;
      }
      patches.set(row.id, {
        ...patches.get(row.id),
        ...(thumbnailUrl !== null ? { thumbnailUrl, thumbnailResolvedAt: now } : {}),
        ...(imageUrl !== null ? { imageUrl } : {}),
        imageResolvedAt: now,
      });
    }
  }

  const staleVideos = rows.filter(
    (row) =>
      row.videoId !== null &&
      (force ||
        isAttemptStale(row.posterResolvedAt, now, ttlDays) ||
        isAttemptStale(row.sourceResolvedAt, now, ttlDays))
  );
  const videoIds = [...new Set(staleVideos.map((row) => row.videoId as string))];
  for (const videoId of videoIds) {
    let media: MetaVideoMedia | null;
    try {
      media = await adapter.getVideoMedia(videoId);
    } catch (error) {
      if (error instanceof MetaError && error.errorClass === "not_found") {
        continue;
      }
      throw error;
    }
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
      }
      if (media.source !== undefined) {
        patch.sourceUrl = media.source;
      }
      patch.posterResolvedAt = now;
      patch.sourceResolvedAt = now;
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
        imageUrl: patch?.imageUrl ?? row.imageUrl,
        videoId: row.videoId,
        carouselCount: row.carouselCount,
        posterUrl: patch?.posterUrl ?? row.posterUrl,
        sourceUrl: patch?.sourceUrl ?? row.sourceUrl,
      },
    ];
  });
}
