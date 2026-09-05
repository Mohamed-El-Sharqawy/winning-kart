import { describe, expect, test } from "bun:test";
import { deriveAdMetrics, deriveAdTrend } from "./ads-metrics";

describe("deriveAdMetrics", () => {
  test("null sums produce null metrics", () => {
    expect(deriveAdMetrics(null)).toBeNull();
  });

  test("derives roas, cpa, ctr, frequency with rounding", () => {
    expect(
      deriveAdMetrics({ spend: 100, revenue: 300, purchases: 2, clicks: 10, impressions: 1000, reach: 500 })
    ).toEqual({
      spend: 100,
      revenue: 300,
      purchases: 2,
      roas: 3,
      cpa: 50,
      ctr: 1,
      frequency: 2,
    });
  });

  test("zero-spend rows yield null ratios", () => {
    const metrics = deriveAdMetrics({ spend: 0, revenue: 0, purchases: 0, clicks: 0, impressions: 0, reach: 0 });
    expect(metrics).toEqual({
      spend: 0,
      revenue: 0,
      purchases: 0,
      roas: null,
      cpa: null,
      ctr: null,
      frequency: null,
    });
  });
});

describe("deriveAdTrend", () => {
  test("returns spend and ctr deltas", () => {
    expect(
      deriveAdTrend({
        spendRecent: 80,
        spendPrior: 50,
        clicksRecent: 8,
        impressionsRecent: 800,
        clicksPrior: 2,
        impressionsPrior: 200,
      })
    ).toEqual({ spend: 30, ctr: 0 });
  });

  test("ctr delta is null when either window lacks impressions", () => {
    expect(
      deriveAdTrend({
        spendRecent: 10,
        spendPrior: 0,
        clicksRecent: 0,
        impressionsRecent: 0,
        clicksPrior: 2,
        impressionsPrior: 200,
      })
    ).toEqual({ spend: 10, ctr: null });
  });
});
