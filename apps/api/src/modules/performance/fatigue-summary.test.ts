import { describe, expect, test } from "bun:test";
import { SCAN_CHUNK } from "./ads-scan";
import type { AdsRow } from "./ads-decoration";
import type { AdsPageInput } from "./ads-repository";
import { adRow, depsWith, memoryPageAds, pausedRow } from "./ads-list.fakes";
import { fatigueSummary } from "./fatigue-summary";
import { expectProblem } from "./list-fakes";

function bleedingRow(id: string, spend: number, sortValue: number | null): AdsRow {
  return adRow({
    id,
    sortValue,
    sums: { spend, revenue: spend * 0.5, purchases: 2, clicks: 10, impressions: 1000, reach: 500 },
    spendShare: 0.3,
  });
}

function fatiguingRow(id: string, spend: number, sortValue: number | null): AdsRow {
  return adRow({
    id,
    sortValue,
    sums: { spend, revenue: 300, purchases: 2, clicks: 12, impressions: 1000, reach: 100 },
    trend: {
      spendRecent: 80,
      spendPrior: 50,
      clicksRecent: 2,
      impressionsRecent: 1000,
      clicksPrior: 10,
      impressionsPrior: 1000,
    },
    spendShare: 0.25,
  });
}

function scaleRow(id: string, spend: number, sortValue: number | null): AdsRow {
  return adRow({
    id,
    sortValue,
    sums: { spend, revenue: spend * 3, purchases: 2, clicks: 10, impressions: 1000, reach: 500 },
    trend: {
      spendRecent: 40,
      spendPrior: 50,
      clicksRecent: 8,
      impressionsRecent: 800,
      clicksPrior: 2,
      impressionsPrior: 200,
    },
  });
}

describe("fatigueSummary", () => {
  test("404s for an unknown account without scanning", async () => {
    const calls: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([], calls));
    await expectProblem(() => fatigueSummary(deps, "acc-404", {}), 404, "RESOURCE_NOT_FOUND");
    expect(calls).toHaveLength(0);
  });

  test("invalid filter values are 422 VALIDATION before the scan", async () => {
    const calls: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([], calls));
    await expectProblem(() => fatigueSummary(deps, "acc-1", { status: "archived" }), 422, "VALIDATION");
    await expectProblem(() => fatigueSummary(deps, "acc-1", { flag: "winning" }), 422, "VALIDATION");
    await expectProblem(() => fatigueSummary(deps, "acc-1", { format: "GIF" }), 422, "VALIDATION");
    expect(calls).toHaveLength(0);
  });

  test("counts flags and spend concentration over the whole filtered set", async () => {
    const rows = [
      bleedingRow("ad-1", 100, 5),
      fatiguingRow("ad-2", 60, 4),
      scaleRow("ad-3", 60, 3),
      pausedRow("ad-4", 2),
      adRow({ id: "ad-5", sums: null, sortValue: 1 }),
    ];
    const calls: AdsPageInput[] = [];
    const result = await fatigueSummary(depsWith(memoryPageAds(rows, calls)), "acc-1", {});
    expect(result.counts).toEqual({ fatiguing: 1, bleeding: 1, scale: 1, status_anomaly: 1 });
    expect(result.topCreativeSpendShare).toBe(0.45);
    expect(result.top3SpendShare).toBe(1);
    expect(result.concentration).toBe("top3");
    expect(calls).toHaveLength(1);
  });

  test("a flag filter narrows the aggregated set", async () => {
    const rows = [bleedingRow("ad-1", 100, 2), fatiguingRow("ad-2", 60, 1)];
    const result = await fatigueSummary(depsWith(memoryPageAds(rows, [])), "acc-1", { flag: "bleeding" });
    expect(result.counts).toEqual({ fatiguing: 0, bleeding: 1, scale: 0, status_anomaly: 0 });
    expect(result.topCreativeSpendShare).toBe(1);
    expect(result.concentration).toBe("top1");
  });

  test("forwards the ads filters to the repository with the fixed spend-desc ordering", async () => {
    const calls: AdsPageInput[] = [];
    await fatigueSummary(depsWith(memoryPageAds([], calls)), "acc-1", {
      campaignId: "cmp-9",
      status: "inactive",
      q: "retarget",
    });
    const input = calls[0];
    expect(input?.filters.campaignId).toBe("cmp-9");
    expect(input?.filters.q).toBe("retarget");
    expect(input?.filters.statuses).not.toContain("ACTIVE");
    expect(input?.sort).toBe("spend");
    expect(input?.order).toBe("desc");
  });

  test("scans past the first chunk until the set is exhausted", async () => {
    const rows = Array.from({ length: SCAN_CHUNK + 1 }, (_, index) =>
      bleedingRow(`ad-${index + 1}`, 100, index + 1)
    );
    const calls: AdsPageInput[] = [];
    const result = await fatigueSummary(depsWith(memoryPageAds(rows, calls)), "acc-1", {});
    expect(calls).toHaveLength(2);
    expect(calls[0]?.limit).toBe(SCAN_CHUNK);
    expect(calls[1]?.cursor?.id).toBe("ad-2");
    expect(result.counts.bleeding).toBe(SCAN_CHUNK + 1);
  });

  test("an empty filtered set has null shares and zero counts", async () => {
    const result = await fatigueSummary(depsWith(memoryPageAds([], [])), "acc-1", {});
    expect(result).toEqual({
      topCreativeSpendShare: null,
      top3SpendShare: null,
      concentration: null,
      counts: { fatiguing: 0, bleeding: 0, scale: 0, status_anomaly: 0 },
    });
  });
});
