import { expect } from "bun:test";
import { ProblemError } from "../../lib/problem";
import type { AdsSums } from "./ads-decoration";
import type { AdSetDbRow, CampaignDbRow } from "./list-items";
import type { PagedListInput, SummaryInput } from "./list-repository";
import type { ListsDeps } from "./list-service";

export function campaignDbRow(overrides: Partial<CampaignDbRow> = {}): CampaignDbRow {
  return {
    id: "cmp-1",
    name: "Campaign 1",
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    buyingType: "AUCTION",
    currency: "AED",
    dailyBudget: "150.00",
    lifetimeBudget: null,
    scheduleStart: null,
    scheduleEnd: null,
    sums: { spend: 100, revenue: 300, purchases: 2, clicks: 10, impressions: 1000, reach: 500 },
    ...overrides,
  };
}

export function adSetDbRow(overrides: Partial<AdSetDbRow> = {}): AdSetDbRow {
  return {
    id: "set-1",
    campaignId: "cmp-1",
    campaignName: "Campaign 1",
    platformAdsetId: "plat-set-1",
    name: "Ad Set 1",
    status: "ACTIVE",
    optimizationGoal: "OFFSITE_CONVERSIONS",
    bidStrategy: "LOWEST_COST_WITHOUT_CAP",
    dailyBudget: "80.00",
    currency: "AED",
    sums: { spend: 100, revenue: 300, purchases: 2, clicks: 10, impressions: 1000, reach: 500 },
    ...overrides,
  };
}

export interface ListCallRecorder {
  campaigns: PagedListInput[];
  adSets: PagedListInput[];
  campaignSummaries: SummaryInput[];
  adSetSummaries: SummaryInput[];
}

export function memoryListDeps(
  options: {
    campaigns?: CampaignDbRow[];
    adSets?: AdSetDbRow[];
    campaignTotal?: number;
    adSetTotal?: number;
    campaignSummary?: AdsSums;
    adSetSummary?: AdsSums;
    accountless?: boolean;
  } = {}
): ListsDeps & { calls: ListCallRecorder } {
  const calls: ListCallRecorder = {
    campaigns: [],
    adSets: [],
    campaignSummaries: [],
    adSetSummaries: [],
  };
  return {
    calls,
    findAccount: async (id) => (options.accountless ? undefined : { id }),
    pageCampaigns: async (input) => {
      calls.campaigns.push(input);
      return { rows: options.campaigns ?? [], total: options.campaignTotal ?? 0 };
    },
    pageAdSets: async (input) => {
      calls.adSets.push(input);
      return { rows: options.adSets ?? [], total: options.adSetTotal ?? 0 };
    },
    campaignSummary: async (input) => {
      calls.campaignSummaries.push(input);
      return options.campaignSummary ?? { spend: 0, revenue: 0, purchases: 0, clicks: 0, impressions: 0, reach: 0 };
    },
    adSetSummary: async (input) => {
      calls.adSetSummaries.push(input);
      return options.adSetSummary ?? { spend: 0, revenue: 0, purchases: 0, clicks: 0, impressions: 0, reach: 0 };
    },
  };
}

export function expectProblem(run: () => Promise<unknown>, status: number, code: string): Promise<void> {
  return run().then(
    () => {
      throw new Error("expected a ProblemError");
    },
    (error) => {
      expect(error).toBeInstanceOf(ProblemError);
      expect((error as ProblemError).status).toBe(status);
      expect((error as ProblemError).code).toBe(code);
    }
  );
}
