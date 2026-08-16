import type { AdSetDto } from "../dto/ad-sets.dto";
import type { AdSet } from "../types/ad-sets.types";

export function toAdSet(dto: AdSetDto): AdSet {
  return {
    id: dto.id,
    campaignId: dto.campaignId,
    campaignName: dto.campaignName,
    platformAdsetId: dto.platformAdsetId,
    name: dto.name,
    status: dto.status,
    optimizationGoal: dto.optimizationGoal,
    bidStrategy: dto.bidStrategy,
    dailyBudget: dto.dailyBudget ?? null,
    currency: dto.currency,
    spend: dto.spend ?? null,
    revenue: dto.revenue ?? null,
    purchases: dto.purchases ?? null,
    roas: dto.roas ?? null,
    cpa: dto.cpa ?? null,
    cpc: dto.cpc ?? null,
    cpm: dto.cpm ?? null,
    ctr: dto.ctr ?? null,
    frequency: dto.frequency ?? null,
    reach: dto.reach ?? null,
  };
}

export function toAdSets(dtos: AdSetDto[]): AdSet[] {
  return dtos.map(toAdSet);
}
