import type { FatigueFlag } from "../types/creatives.types";

export interface CreativeFatigueDto {
  flag: FatigueFlag;
  reason: string;
}

export interface AdMetricsDto {
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

export interface AdTrendDto {
  spend: number;
  ctr: number | null;
}

export interface GalleryAdDto {
  id: string;
  name: string;
  status: string;
  format: string | null;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  thumbnailUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
  bodyCopy: string | null;
  metrics: AdMetricsDto | null;
  spendShare: number | null;
  trend: AdTrendDto;
  fatigue: CreativeFatigueDto | null;
}

export interface GalleryPageDto {
  data: GalleryAdDto[];
  meta: { nextCursor: string | null };
}

export interface GalleryAdDetailDto extends GalleryAdDto {
  posterUrl: string | null;
  sourceUrl: string | null;
  adsManagerUrl: string;
  embedUrl: string | null;
}

export interface RepairedMediaDto {
  adId: string;
  format: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
}

export interface MediaResolveResponseDto {
  data: { items: RepairedMediaDto[] };
}

export interface FatigueSummaryDto {
  topCreativeSpendShare: number | null;
  top3SpendShare: number | null;
  concentration: "top1" | "top3" | null;
  counts: {
    fatiguing: number;
    bleeding: number;
    scale: number;
    status_anomaly: number;
  };
}
