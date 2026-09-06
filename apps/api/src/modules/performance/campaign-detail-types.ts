import type { AdsRow } from "./ads-decoration";
import type { AdsPageInput } from "./ads-repository";
import type { AdSetDbRow, AdSetPerformance } from "./ad-set-items";
import type { PagedListInput, PagedRows } from "./list-repository";
import type { CampaignDailyRow, CampaignEntityRow, WindowSums } from "./model";
import type { FatigueFinding } from "../../detection/fatigue";

export interface AdPerformance {
  id: string;
  adSetId: string;
  adSetName: string;
  campaignName: string;
  platformAdId: string;
  name: string;
  status: string;
  format: string | null;
  creativeId: string | null;
  thumbnailUrl: string | null;
  bodyCopy: string | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  fatigue: FatigueFinding | null;
}

export interface SeriesPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
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

export interface CampaignPrev {
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}

export interface CampaignDetailPayload {
  adAccountId: string;
  adAccountPlatformId: string;
  accountName: string;
  campaign: CampaignPerformance;
  prev: CampaignPrev;
  series: SeriesPoint[];
  funnel: CampaignFunnel;
  adSets: AdSetPerformance[];
  ads: AdPerformance[];
}

export interface CampaignDetailDeps {
  findAccount(id: string): Promise<{ id: string } | undefined>;
  findCampaign(id: string): Promise<CampaignEntityRow | undefined>;
  windowMetrics(
    accountId: string,
    level: "campaign",
    since: string,
    until: string
  ): Promise<WindowSums[]>;
  campaignSeries(accountId: string, campaignId: string, since: string, until: string): Promise<CampaignDailyRow[]>;
  pageAdSets(input: PagedListInput): Promise<PagedRows<AdSetDbRow>>;
  pageAds(input: AdsPageInput): Promise<AdsRow[]>;
}
