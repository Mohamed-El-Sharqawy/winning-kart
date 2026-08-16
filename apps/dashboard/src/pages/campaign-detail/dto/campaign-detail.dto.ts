export interface CampaignDetailDto {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

export interface CampaignSeriesPointDto {
  date: string;
  spend: number | null;
  revenue: number | null;
  roas: number | null;
}

export interface CampaignFunnelDto {
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  landingPageViews: number | null;
  addToCart: number | null;
  initiateCheckout: number | null;
  purchases: number | null;
  revenue: number | null;
}

export interface AdSetDto {
  id: string;
  name: string;
  status: string;
  optimizationGoal: string;
  dailyBudget: number | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
  reach: number | null;
}

export interface AdFatigueDto {
  flag: string;
  reason: string;
}

export interface AdDto {
  id: string;
  name: string;
  status: string;
  format: string;
  thumbnailUrl: string | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  fatigue: AdFatigueDto | null;
}

export interface CampaignDetailResponseDto {
  campaign: CampaignDetailDto;
  series: CampaignSeriesPointDto[];
  funnel: CampaignFunnelDto;
  adSets: AdSetDto[];
  ads: AdDto[];
}
