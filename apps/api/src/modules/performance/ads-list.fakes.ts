import { expect } from "bun:test";
import { ProblemError } from "../../lib/problem";
import type { AdsPageInput } from "./ads-repository";
import type { AdsRow } from "./ads-decoration";
import type { AdsListDeps } from "./ads-list";

export function adRow(overrides: Partial<AdsRow> = {}): AdsRow {
  const now = Date.now();
  return {
    id: "ad-1",
    adSetId: "adset-1",
    adSetName: "Ad Set 1",
    campaignId: "cmp-1",
    campaignName: "Campaign 1",
    platformAdId: "plat-1",
    name: "Ad 1",
    status: "ACTIVE",
    format: "IMAGE",
    videoId: null,
    carouselCount: null,
    thumbnailUrl: "https://cdn/thumb.jpg",
    thumbnailResolvedAt: new Date(now - 86400000),
    bodyCopy: "Buy flowers",
    parentAdSetStatus: "ACTIVE",
    sums: { spend: 100, revenue: 300, purchases: 2, clicks: 10, impressions: 1000, reach: 500 },
    trend: { spendRecent: 80, spendPrior: 50, clicksRecent: 8, impressionsRecent: 800, clicksPrior: 2, impressionsPrior: 200 },
    spendShare: 0.25,
    medianRoas: 1,
    medianSpend: 100,
    sortValue: 100,
    ...overrides,
  };
}

export function pausedRow(id: string, sortValue: number | null): AdsRow {
  return adRow({
    id,
    status: "PAUSED",
    sums: null,
    spendShare: null,
    trend: { spendRecent: 0, spendPrior: 0, clicksRecent: 0, impressionsRecent: 0, clicksPrior: 0, impressionsPrior: 0 },
    sortValue,
  });
}

export function isAfterCursor(row: AdsRow, cursor: { id: string; sortValue: number | null } | null): boolean {
  if (cursor === null) {
    return true;
  }
  if (row.sortValue === null) {
    return cursor.sortValue === null ? row.id > cursor.id : true;
  }
  if (cursor.sortValue === null) {
    return false;
  }
  if (row.sortValue === cursor.sortValue) {
    return row.id > cursor.id;
  }
  return row.sortValue < cursor.sortValue;
}

export function memoryPageAds(rows: AdsRow[], recorder: AdsPageInput[]) {
  return async (input: AdsPageInput): Promise<AdsRow[]> => {
    recorder.push(input);
    const after = rows
      .filter((row) => isAfterCursor(row, input.cursor))
      .sort((a, b) => {
        if (a.sortValue === null || b.sortValue === null) {
          return a.sortValue === b.sortValue ? (a.id < b.id ? -1 : 1) : a.sortValue === null ? 1 : -1;
        }
        if (a.sortValue !== b.sortValue) {
          return b.sortValue - a.sortValue;
        }
        return a.id < b.id ? -1 : 1;
      });
    return after.slice(0, input.limit);
  };
}

export function depsWith(
  pageAds: (input: AdsPageInput) => Promise<AdsRow[]>,
  options: { accountless?: boolean } = {}
): AdsListDeps & { refresherCalls: string[][] } {
  const refresherCalls: string[][] = [];
  return {
    findAccount: async (id) => (options.accountless || id === "acc-404" ? undefined : { id }),
    pageAds,
    refresher: {
      resolve: async (ids) => {
        refresherCalls.push(ids);
        return ids.map((id) => ({
          adId: id,
          format: "IMAGE" as const,
          thumbnailUrl: `https://cdn/fresh-${id}.jpg`,
          videoId: null,
          carouselCount: null,
        }));
      },
    },
    refresherCalls,
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
