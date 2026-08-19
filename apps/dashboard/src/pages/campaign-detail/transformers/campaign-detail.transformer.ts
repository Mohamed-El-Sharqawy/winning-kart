import type {
  AdDto,
  AdSetDto,
  CampaignDetailDto,
  CampaignDetailResponseDto,
  CampaignFunnelDto,
  CampaignSeriesPointDto,
} from "../dto/campaign-detail.dto";
import type {
  CampaignAd,
  CampaignAdSet,
  CampaignDayPoint,
  CampaignDetail,
  CampaignFunnel,
  CampaignSummary,
} from "../types/campaign-detail.types";

function toNumber(value: number | null | undefined): number | null {
  return value ?? null;
}

function toCount(value: number | null | undefined): number {
  return value ?? 0;
}

function toCampaign(dto: CampaignDetailDto): CampaignSummary {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    objective: dto.objective,
    dailyBudget: toNumber(dto.dailyBudget),
    lifetimeBudget: toNumber(dto.lifetimeBudget),
    currency: dto.currency,
    spend: toNumber(dto.spend),
    revenue: toNumber(dto.revenue),
    purchases: toNumber(dto.purchases),
    roas: toNumber(dto.roas),
    cpa: toNumber(dto.cpa),
    ctr: toNumber(dto.ctr),
    frequency: toNumber(dto.frequency),
  };
}

function toSeriesPoint(dto: CampaignSeriesPointDto): CampaignDayPoint {
  return {
    date: dto.date,
    spend: toCount(dto.spend),
    revenue: toCount(dto.revenue),
    roas: toNumber(dto.roas),
  };
}

function toFunnel(dto: CampaignFunnelDto): CampaignFunnel {
  return {
    impressions: toCount(dto.impressions),
    reach: toCount(dto.reach),
    clicks: toCount(dto.clicks),
    landingPageViews: toCount(dto.landingPageViews),
    addToCart: toCount(dto.addToCart),
    initiateCheckout: toCount(dto.initiateCheckout),
    purchases: toCount(dto.purchases),
    revenue: toCount(dto.revenue),
  };
}

function toAdSet(dto: AdSetDto): CampaignAdSet {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    optimizationGoal: dto.optimizationGoal,
    dailyBudget: toNumber(dto.dailyBudget),
    currency: dto.currency,
    spend: toNumber(dto.spend),
    revenue: toNumber(dto.revenue),
    purchases: toNumber(dto.purchases),
    roas: toNumber(dto.roas),
    cpa: toNumber(dto.cpa),
    ctr: toNumber(dto.ctr),
    frequency: toNumber(dto.frequency),
    reach: toNumber(dto.reach),
  };
}

function toAd(dto: AdDto): CampaignAd {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    format: dto.format,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    spend: toNumber(dto.spend),
    revenue: toNumber(dto.revenue),
    purchases: toNumber(dto.purchases),
    roas: toNumber(dto.roas),
    ctr: toNumber(dto.ctr),
    frequency: toNumber(dto.frequency),
    spendShare: toNumber(dto.spendShare),
    fatigue: dto.fatigue ? { flag: dto.fatigue.flag, reason: dto.fatigue.reason } : null,
  };
}

export function toCampaignDetail(dto: CampaignDetailResponseDto): CampaignDetail {
  return {
    adAccountId: dto.adAccountId ?? null,
    adAccountPlatformId: dto.adAccountPlatformId ?? null,
    accountName: dto.accountName ?? null,
    campaign: toCampaign(dto.campaign),
    series: dto.series.map(toSeriesPoint),
    funnel: toFunnel(dto.funnel),
    adSets: dto.adSets.map(toAdSet),
    ads: dto.ads.map(toAd),
  };
}
