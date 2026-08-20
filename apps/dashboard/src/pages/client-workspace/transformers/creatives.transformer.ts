import type { CreativeDto, CreativeFatigueDto, FatigueSummaryDto } from "../dto/creatives.dto";
import type { Creative, CreativeFatigue, FatigueSummary } from "../types/creatives.types";

function toFatigue(dto: CreativeFatigueDto | null | undefined): CreativeFatigue | null {
  if (!dto) return null;
  return { flag: dto.flag, reason: dto.reason };
}

export function toCreative(dto: CreativeDto): Creative {
  return {
    id: dto.id,
    adSetId: dto.adSetId,
    adSetName: dto.adSetName,
    campaignName: dto.campaignName,
    platformAdId: dto.platformAdId,
    name: dto.name,
    status: dto.status,
    format: dto.format,
    bodyCopy: dto.bodyCopy ?? null,
    creativeId: dto.creativeId,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    previewImageUrl: dto.previewImageUrl ?? null,
    previewVideoUrl: dto.previewVideoUrl ?? null,
    spend: dto.spend ?? null,
    revenue: dto.revenue ?? null,
    purchases: dto.purchases ?? null,
    roas: dto.roas ?? null,
    cpa: dto.cpa ?? null,
    ctr: dto.ctr ?? null,
    frequency: dto.frequency ?? null,
    spendShare: dto.spendShare ?? null,
    fatigue: toFatigue(dto.fatigue),
  };
}

export function toCreatives(dtos: CreativeDto[]): Creative[] {
  return dtos.map(toCreative);
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
