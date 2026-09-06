import type { AdsRow } from "./ads-decoration";
import type { AdsPageInput } from "./ads-repository";
import type { CampaignDetailDeps } from "./campaign-detail-types";
import type { AdSetDbRow } from "./ad-set-items";
import type { PagedListInput } from "./list-repository";
import type { CampaignDailyRow, CampaignEntityRow, WindowSums } from "./model";

export function campaignEntityRow(overrides: Partial<CampaignEntityRow> = {}): CampaignEntityRow {
  return {
    id: "cmp-1",
    adAccountId: "acc-1",
    adAccountPlatformId: "act_111",
    accountName: "Acme",
    name: "Spring Sale",
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    dailyBudget: "50.00",
    lifetimeBudget: null,
    currency: "AED",
    ...overrides,
  };
}

export function windowSums(overrides: Partial<WindowSums> = {}): WindowSums {
  return {
    entityId: "cmp-1",
    spend: 100,
    revenue: 300,
    purchases: 2,
    clicks: 10,
    impressions: 1000,
    reach: 500,
    landingPageViews: 40,
    addToCart: 12,
    initiateCheckout: 6,
    ...overrides,
  };
}

export interface CampaignDetailCalls {
  windowMetrics: Array<{ level: string; since: string; until: string }>;
  series: Array<{ since: string; until: string }>;
  adSets: PagedListInput[];
  ads: AdsPageInput[];
}

export function memoryCampaignDetailDeps(
  options: {
    accountless?: boolean;
    campaign?: CampaignEntityRow;
    sums?: Record<string, WindowSums[]>;
    series?: CampaignDailyRow[];
    adSets?: AdSetDbRow[];
    ads?: AdsRow[];
  } = {}
): CampaignDetailDeps & { calls: CampaignDetailCalls } {
  const calls: CampaignDetailCalls = { windowMetrics: [], series: [], adSets: [], ads: [] };
  return {
    calls,
    findAccount: async (id) => (options.accountless ? undefined : { id }),
    findCampaign: async () => options.campaign,
    windowMetrics: async (accountId, level, since, until) => {
      calls.windowMetrics.push({ level, since, until });
      return options.sums?.[`${since}..${until}`] ?? [];
    },
    campaignSeries: async (accountId, campaignId, since, until) => {
      calls.series.push({ since, until });
      return options.series ?? [];
    },
    pageAdSets: async (input) => {
      calls.adSets.push(input);
      return { rows: options.adSets ?? [], total: options.adSets?.length ?? 0 };
    },
    pageAds: async (input) => {
      calls.ads.push(input);
      return options.ads ?? [];
    },
  };
}
