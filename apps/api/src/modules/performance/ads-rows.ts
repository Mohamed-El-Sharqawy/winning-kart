import type { AdsRow } from "./ads-decoration";

export interface AdsPageDbRow {
  id: string;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  platformAdId: string;
  name: string;
  status: string;
  format: string | null;
  videoId: string | null;
  carouselCount: number | null;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: string | Date | null;
  bodyCopy: string | null;
  parentAdSetStatus: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  clicks: number | null;
  impressions: number | null;
  reach: number | null;
  spendRecent: number | null;
  spendPrior: number | null;
  clicksRecent: number | null;
  clicksPrior: number | null;
  impressionsRecent: number | null;
  impressionsPrior: number | null;
  spendShare: number | null;
  medianRoas: number | null;
  medianSpend: number | null;
  sortValue: number | null;
}

function toTimestamp(value: string | Date | null): Date | null {
  if (value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const iso = value.replace(" ", "T");
  const normalized = /\+\d\d$/.test(iso) ? `${iso}:00` : iso;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toAdsRow(row: AdsPageDbRow): AdsRow {
  return {
    id: row.id,
    adSetId: row.adSetId,
    adSetName: row.adSetName,
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    platformAdId: row.platformAdId,
    name: row.name,
    status: row.status,
    format: row.format,
    videoId: row.videoId,
    carouselCount: row.carouselCount,
    thumbnailUrl: row.thumbnailUrl,
    thumbnailResolvedAt: toTimestamp(row.thumbnailResolvedAt),
    bodyCopy: row.bodyCopy,
    parentAdSetStatus: row.parentAdSetStatus,
    sums:
      row.spend === null || row.revenue === null || row.purchases === null || row.clicks === null || row.impressions === null || row.reach === null
        ? null
        : {
            spend: row.spend,
            revenue: row.revenue,
            purchases: row.purchases,
            clicks: row.clicks,
            impressions: row.impressions,
            reach: row.reach,
          },
    trend: {
      spendRecent: row.spendRecent ?? 0,
      spendPrior: row.spendPrior ?? 0,
      clicksRecent: row.clicksRecent ?? 0,
      impressionsRecent: row.impressionsRecent ?? 0,
      clicksPrior: row.clicksPrior ?? 0,
      impressionsPrior: row.impressionsPrior ?? 0,
    },
    spendShare: row.spendShare,
    medianRoas: row.medianRoas,
    medianSpend: row.medianSpend,
    sortValue: row.sortValue,
  };
}
