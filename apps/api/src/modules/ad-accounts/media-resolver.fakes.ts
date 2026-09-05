import type { MetaAdRow } from "../../platforms/meta";
import { MetaError } from "../../platforms/meta";
import type { AdMediaPatch } from "./model";
import type { MediaResolverAdapter, MediaResolverModel } from "./media-resolver";

export const DAY_MS = 86400000;

export const ACCOUNT = { id: "acc-1" };

export interface FakeRow {
  id: string;
  platformAdId: string;
  format: "IMAGE" | "VIDEO" | "CAROUSEL" | null;
  videoId: string | null;
  carouselCount: number | null;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: Date | null;
  posterUrl: string | null;
  posterResolvedAt: Date | null;
  sourceUrl: string | null;
  sourceResolvedAt: Date | null;
}

export function row(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: "ad-1",
    platformAdId: "plat-1",
    format: "IMAGE",
    videoId: null,
    carouselCount: null,
    thumbnailUrl: "https://cdn/fresh.jpg",
    thumbnailResolvedAt: new Date(Date.now() - DAY_MS),
    posterUrl: null,
    posterResolvedAt: null,
    sourceUrl: null,
    sourceResolvedAt: null,
    ...overrides,
  };
}

export function adRow(platformAdId: string, thumbnailUrl: string): MetaAdRow {
  return {
    id: platformAdId,
    adset_id: "adset-1",
    name: "ad",
    creative: { id: `creative-${platformAdId}`, thumbnail_url: thumbnailUrl },
  };
}

export class FakeModel implements MediaResolverModel {
  calls: { adId: string; patch: AdMediaPatch }[] = [];

  constructor(private readonly rows: FakeRow[]) {}

  async findAdsMediaByIds(_adAccountId: string, ids: string[]): Promise<FakeRow[]> {
    return this.rows.filter((r) => ids.includes(r.id));
  }

  async updateAdMedia(adId: string, patch: AdMediaPatch): Promise<void> {
    this.calls.push({ adId, patch });
  }
}

export class FakeAdapter implements MediaResolverAdapter {
  adCalls: string[][] = [];
  videoCalls: string[] = [];
  adResponse: MetaAdRow[] = [];
  videoResponse = new Map<string, { source?: string; picture?: string }>();
  adError: Error | null = null;
  videoError: Error | null = null;

  async getAdsByIds(ids: string[]): Promise<MetaAdRow[]> {
    if (this.adError !== null) {
      throw this.adError;
    }
    this.adCalls.push(ids);
    return this.adResponse;
  }

  async getVideoMedia(videoId: string): Promise<{ source?: string; picture?: string } | null> {
    this.videoCalls.push(videoId);
    if (this.videoError !== null) {
      throw this.videoError;
    }
    return this.videoResponse.get(videoId) ?? null;
  }
}

export function serverError(): MetaError {
  return new MetaError("server_error", "upstream exploded");
}

export function notFoundError(): MetaError {
  return new MetaError("not_found", "node does not exist");
}
