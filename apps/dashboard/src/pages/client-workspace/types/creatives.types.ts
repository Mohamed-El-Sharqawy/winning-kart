export type FatigueFlag = "fatiguing" | "bleeding" | "scale" | "status_anomaly";

export interface CreativeFatigue {
  flag: FatigueFlag;
  reason: string;
}

export type AdFormat = "IMAGE" | "VIDEO" | "CAROUSEL";

export type EffectiveStatus =
  | "ACTIVE"
  | "PAUSED"
  | "CAMPAIGN_PAUSED"
  | "ADSET_PAUSED"
  | "PENDING_REVIEW"
  | "DISAPPROVED"
  | "PREAPPROVED"
  | "PENDING_BILLING_INFO"
  | "WITH_ISSUES"
  | "IN_PROCESS"
  | "UNKNOWN";

export type StatusFilter = "all" | "active" | "inactive" | Lowercase<EffectiveStatus>;

export type GallerySortKey = "spend" | "roas" | "ctr" | "frequency";

export interface GalleryAd {
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
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  trendSpend: number;
  trendCtr: number | null;
  fatigue: CreativeFatigue | null;
}

export interface GalleryAdDetail extends GalleryAd {
  posterUrl: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  adsManagerUrl: string;
  embedUrl: string | null;
}

export interface GalleryPage {
  items: GalleryAd[];
  nextCursor: string | null;
}

export interface RepairedMedia {
  adId: string;
  format: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
}

export type ConcentrationKind = "top1" | "top3";

export interface FatigueCounts {
  fatiguing: number;
  bleeding: number;
  scale: number;
  status_anomaly: number;
}

export interface FatigueSummary {
  topCreativeSpendShare: number | null;
  top3SpendShare: number | null;
  concentration: ConcentrationKind | null;
  counts: FatigueCounts;
}
