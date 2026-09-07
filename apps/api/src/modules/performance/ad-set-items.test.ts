import { describe, expect, test } from "bun:test";
import { toAdSetItem } from "./ad-set-items";
import { adSetDbRow } from "./list-fakes";

describe("toAdSetItem", () => {
  test("derives window metrics including cpc, cpm, and reach", () => {
    const item = toAdSetItem(
      adSetDbRow({ sums: { spend: 100, revenue: 300, purchases: 2, clicks: 10, impressions: 1000, reach: 500 } })
    );
    expect(item.spend).toBe(100);
    expect(item.roas).toBe(3);
    expect(item.cpc).toBe(10);
    expect(item.cpm).toBe(100);
    expect(item.reach).toBe(500);
    expect(item.campaignName).toBe("Campaign 1");
  });

  test("keeps zero-metric ad sets with null metrics", () => {
    const item = toAdSetItem(adSetDbRow({ sums: null, optimizationGoal: null, bidStrategy: null, dailyBudget: null }));
    expect(item.spend).toBeNull();
    expect(item.cpc).toBeNull();
    expect(item.reach).toBeNull();
  });
});
