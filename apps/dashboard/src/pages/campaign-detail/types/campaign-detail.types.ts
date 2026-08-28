export interface CampaignPrev {
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

export interface CampaignSummary {
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

export interface CampaignDayPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface CampaignFunnel {
  impressions: number;
  reach: number;
  clicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  revenue: number;
}

export interface CampaignAdSet {
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

export interface CampaignAd {
  id: string;
  name: string;
  status: string;
  format: string | null;
  thumbnailUrl: string | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  fatigue: { flag: string; reason: string } | null;
}

export interface CampaignDetail {
  adAccountId: string | null;
  adAccountPlatformId: string | null;
  accountName: string | null;
  campaign: CampaignSummary;
  prev: CampaignPrev | null;
  series: CampaignDayPoint[];
  funnel: CampaignFunnel;
  adSets: CampaignAdSet[];
  ads: CampaignAd[];
}
