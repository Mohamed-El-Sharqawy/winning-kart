import { describe, expect, test } from "bun:test";
import { toCampaignItem, toSummary } from "./campaign-items";
import { campaignDbRow } from "./list-fakes";

describe("toCampaignItem", () => {
  test("derives the seven window metrics from sums", () => {
    const item = toCampaignItem(
      campaignDbRow({ sums: { spend: 100, revenue: 300, purchases: 2, clicks: 10, impressions: 1000, reach: 500 } })
    );
    expect(item.spend).toBe(100);
    expect(item.revenue).toBe(300);
    expect(item.purchases).toBe(2);
    expect(item.roas).toBe(3);
    expect(item.cpa).toBe(50);
    expect(item.ctr).toBe(1);
    expect(item.frequency).toBe(2);
  });

  test("keeps zero-metric campaigns with null metrics and ISO schedule dates", () => {
    const item = toCampaignItem(
      campaignDbRow({
        sums: null,
        scheduleStart: new Date("2026-01-05T00:00:00.000Z"),
        scheduleEnd: "2026-02-01 00:00:00+00",
      })
    );
    expect(item.spend).toBeNull();
    expect(item.roas).toBeNull();
    expect(item.ctr).toBeNull();
    expect(item.scheduleStart).toBe("2026-01-05T00:00:00.000Z");
    expect(item.scheduleEnd).toBe("2026-02-01T00:00:00.000Z");
  });

  test("maps structural fields", () => {
    const item = toCampaignItem(campaignDbRow({ id: "cmp-2", name: "Eid", status: "PAUSED" }));
    expect(item.id).toBe("cmp-2");
    expect(item.name).toBe("Eid");
    expect(item.status).toBe("PAUSED");
    expect(item.buyingType).toBe("AUCTION");
    expect(item.currency).toBe("AED");
    expect(item.dailyBudget).toBe("150.00");
  });
});

describe("toSummary", () => {
  test("aggregates totals and derives ratios over the filtered set", () => {
    const summary = toSummary({ spend: 400, revenue: 900, purchases: 4, clicks: 40, impressions: 4000, reach: 1000 });
    expect(summary).toEqual({
      spend: 400,
      revenue: 900,
      purchases: 4,
      roas: 2.25,
      cpa: 100,
      ctr: 1,
      frequency: 4,
    });
  });

  test("an empty filtered set sums to zero with null ratios", () => {
    const summary = toSummary({ spend: 0, revenue: 0, purchases: 0, clicks: 0, impressions: 0, reach: 0 });
    expect(summary.spend).toBe(0);
    expect(summary.purchases).toBe(0);
    expect(summary.roas).toBeNull();
    expect(summary.cpa).toBeNull();
    expect(summary.ctr).toBeNull();
    expect(summary.frequency).toBeNull();
  });
});
