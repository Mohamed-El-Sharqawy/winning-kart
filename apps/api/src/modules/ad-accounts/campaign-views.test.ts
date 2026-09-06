import { describe, expect, test } from "bun:test";
import { mergeCampaignMetrics } from "./campaign-views";
import type { CampaignRow, CampaignWindowMetrics } from "./model";

function campaignRow(id: string, name: string): CampaignRow {
  return {
    id,
    adAccountId: "acc-1",
    platformCampaignId: `plat-${id}`,
    name,
    status: "ACTIVE",
    objective: "OUTCOME_SALES",
    buyingType: "AUCTION",
    dailyBudget: "100.00",
    lifetimeBudget: null,
    currency: "AED",
    scheduleStart: null,
    scheduleEnd: null,
    platformUpdatedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  } as CampaignRow;
}

function metrics(entityId: string, spend: number, revenue: number, purchases: number, clicks: number, impressions: number, reach: number): CampaignWindowMetrics {
  return { entityId, spend, revenue, purchases, clicks, impressions, reach };
}

describe("mergeCampaignMetrics", () => {
  test("zero-metric campaigns stay listed with null metrics", () => {
    const views = mergeCampaignMetrics([campaignRow("a", "Has metrics"), campaignRow("b", "No metrics")], [
      metrics("a", 120.004, 240, 3, 12, 1200, 600),
    ]);
    expect(views.map((view) => view.id)).toEqual(["a", "b"]);
    const zero = views[1];
    expect(zero.spend).toBeNull();
    expect(zero.revenue).toBeNull();
    expect(zero.purchases).toBeNull();
    expect(zero.roas).toBeNull();
    expect(zero.cpa).toBeNull();
    expect(zero.ctr).toBeNull();
    expect(zero.frequency).toBeNull();
  });

  test("sorts by spend desc with nulls last", () => {
    const views = mergeCampaignMetrics(
      [campaignRow("zero", "Zero"), campaignRow("big", "Big"), campaignRow("small", "Small")],
      [metrics("small", 10, 5, 1, 1, 100, 100), metrics("big", 500, 1000, 5, 50, 5000, 2500)]
    );
    expect(views.map((view) => view.id)).toEqual(["big", "small", "zero"]);
  });

  test("derives rounded ratios from window sums", () => {
    const views = mergeCampaignMetrics([campaignRow("a", "A")], [metrics("a", 150.25, 300.75, 3, 33, 3333, 1111)]);
    const view = views[0];
    expect(view.spend).toBe(150.25);
    expect(view.revenue).toBe(300.75);
    expect(view.purchases).toBe(3);
    expect(view.roas).toBe(2);
    expect(view.cpa).toBe(50.08);
    expect(view.ctr).toBe(0.99);
    expect(view.frequency).toBe(3);
  });
});
