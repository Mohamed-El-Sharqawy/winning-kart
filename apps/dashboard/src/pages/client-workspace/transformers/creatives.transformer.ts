import type { GalleryAdDetailDto, GalleryAdDto, GalleryPageDto, RepairedMediaDto } from "../dto/creatives.dto";
import type { GalleryAd, GalleryAdDetail, GalleryPage, RepairedMedia } from "../types/creatives.types";
import type { FatigueSummaryDto } from "../dto/creatives.dto";
import type { FatigueSummary } from "../types/creatives.types";

export function toGalleryAd(dto: GalleryAdDto): GalleryAd {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    format: dto.format,
    adSetId: dto.adSetId,
    adSetName: dto.adSetName,
    campaignId: dto.campaignId,
    campaignName: dto.campaignName,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    videoId: dto.videoId ?? null,
    carouselCount: dto.carouselCount ?? null,
    bodyCopy: dto.bodyCopy ?? null,
    spend: dto.metrics?.spend ?? null,
    revenue: dto.metrics?.revenue ?? null,
    purchases: dto.metrics?.purchases ?? null,
    roas: dto.metrics?.roas ?? null,
    cpa: dto.metrics?.cpa ?? null,
    ctr: dto.metrics?.ctr ?? null,
    frequency: dto.metrics?.frequency ?? null,
    spendShare: dto.spendShare ?? null,
    trendSpend: dto.trend?.spend ?? 0,
    trendCtr: dto.trend?.ctr ?? null,
    fatigue: dto.fatigue ? { flag: dto.fatigue.flag, reason: dto.fatigue.reason } : null,
  };
}

export function toGalleryPage(dto: GalleryPageDto): GalleryPage {
  return {
    items: dto.data.map(toGalleryAd),
    nextCursor: dto.meta?.nextCursor ?? null,
  };
}

export function toGalleryAdDetail(dto: GalleryAdDetailDto): GalleryAdDetail {
  return {
    ...toGalleryAd(dto),
    posterUrl: dto.posterUrl ?? null,
    sourceUrl: dto.sourceUrl ?? null,
    imageUrl: dto.imageUrl ?? null,
    adsManagerUrl: dto.adsManagerUrl,
    embedUrl: dto.embedUrl ?? null,
  };
}

export function toRepairedMedia(dto: RepairedMediaDto): RepairedMedia {
  return {
    adId: dto.adId,
    format: dto.format,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    videoId: dto.videoId ?? null,
    carouselCount: dto.carouselCount ?? null,
  };
}

export function toFatigueSummary(dto: FatigueSummaryDto | null | undefined): FatigueSummary {
  return {
    topCreativeSpendShare: dto?.topCreativeSpendShare ?? null,
    top3SpendShare: dto?.top3SpendShare ?? null,
    concentration: dto?.concentration ?? null,
    counts: {
      fatiguing: dto?.counts?.fatiguing ?? 0,
      bleeding: dto?.counts?.bleeding ?? 0,
      scale: dto?.counts?.scale ?? 0,
      status_anomaly: dto?.counts?.status_anomaly ?? 0,
    },
  };
}
