import { describe, expect, test } from "bun:test";
import { classifyAdsRow, decorateAdsPage, fatigueFlagCounts } from "./ads-decoration";
import type { AdsRow } from "./ads-decoration";

function row(overrides: Partial<AdsRow> = {}): AdsRow {
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
    thumbnailResolvedAt: new Date("2026-09-01T00:00:00Z"),
    bodyCopy: "Buy flowers",
    parentAdSetStatus: "ACTIVE",
    sums: {
      spend: 100,
      revenue: 300,
      purchases: 2,
      clicks: 10,
      impressions: 1000,
      reach: 500,
    },
    trend: {
      spendRecent: 80,
      spendPrior: 50,
      clicksRecent: 8,
      impressionsRecent: 800,
      clicksPrior: 2,
      impressionsPrior: 200,
    },
    spendShare: 0.25,
    medianRoas: 1,
    medianSpend: 100,
    sortValue: 100,
    ...overrides,
  };
}

const ZERO_TREND = {
  spendRecent: 0,
  spendPrior: 0,
  clicksRecent: 0,
  impressionsRecent: 0,
  clicksPrior: 0,
  impressionsPrior: 0,
};

describe("decorateAdsPage", () => {
  test("maps row identity and media fields onto the item", () => {
    const [item] = decorateAdsPage([row()]);
    expect(item).toMatchObject({
      id: "ad-1",
      name: "Ad 1",
      status: "ACTIVE",
      format: "IMAGE",
      adSetId: "adset-1",
      adSetName: "Ad Set 1",
      campaignId: "cmp-1",
      campaignName: "Campaign 1",
      thumbnailUrl: "https://cdn/thumb.jpg",
      videoId: null,
      carouselCount: null,
      bodyCopy: "Buy flowers",
      spendShare: 0.25,
    });
  });

  test("zero-insights ads keep metrics null", () => {
    const [item] = decorateAdsPage([row({ sums: null, spendShare: null })]);
    expect(item.metrics).toBeNull();
    expect(item.fatigue).toBeNull();
    expect(item.spendShare).toBeNull();
    expect(item.trend).toEqual({ spend: 30, ctr: 0 });
  });

  test("classifies bleeding ads from spend share and roas", () => {
    const [item] = decorateAdsPage([
      row({
        sums: { spend: 100, revenue: 50, purchases: 1, clicks: 1, impressions: 100, reach: 50 },
        medianRoas: null,
        medianSpend: null,
      }),
    ]);
    expect(item.fatigue).toEqual({
      flag: "bleeding",
      reason: "25% of cohort spend at 0.5x ROAS",
    });
  });

  test("classifies status anomalies for paused ads in active ad sets", () => {
    const [item] = decorateAdsPage([
      row({ status: "PAUSED", sums: null, spendShare: null, trend: ZERO_TREND }),
    ]);
    expect(item.fatigue).toEqual({ flag: "status_anomaly", reason: "Paused while its ad set is active" });
  });

  test("cohort medians feed the scale flag", () => {
    const [item] = decorateAdsPage([
      row({
        sums: { spend: 10, revenue: 30, purchases: 0, clicks: 1, impressions: 100, reach: 60 },
        trend: { spendRecent: 4, spendPrior: 0, clicksRecent: 1, impressionsRecent: 100, clicksPrior: 0, impressionsPrior: 0 },
      }),
    ]);
    expect(item.fatigue).toEqual({ flag: "scale", reason: "3x ROAS at low saturation" });
  });
});

describe("classifyAdsRow", () => {
  test("matches classifyAd on the decorated page", () => {
    const adRow = row();
    const [item] = decorateAdsPage([adRow]);
    expect(classifyAdsRow(adRow, item.metrics)).toEqual(item.fatigue);
  });
});

describe("fatigueFlagCounts", () => {
  test("counts flags across items and stays consistent with row flags", () => {
    const items = decorateAdsPage([
      row({ id: "a", status: "PAUSED", sums: null, spendShare: null, trend: ZERO_TREND }),
      row({ id: "b", sums: { spend: 100, revenue: 50, purchases: 1, clicks: 1, impressions: 100, reach: 50 }, medianRoas: null, medianSpend: null }),
      row({ id: "c" }),
    ]);
    const counts = fatigueFlagCounts(items);
    expect(counts).toEqual({
      fatiguing: 0,
      bleeding: 1,
      scale: 0,
      status_anomaly: 1,
    });
    for (const item of items) {
      if (item.fatigue !== null) {
        expect(counts[item.fatigue.flag]).toBeGreaterThan(0);
      }
    }
  });
});
