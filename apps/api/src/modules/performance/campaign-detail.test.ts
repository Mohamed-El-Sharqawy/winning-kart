import { describe, expect, test } from "bun:test";
import { shiftDate } from "../../lib/window";
import { campaignDetail } from "./campaign-detail";
import { campaignEntityRow, memoryCampaignDetailDeps, windowSums } from "./campaign-detail.fakes";
import { adRow } from "./ads-list.fakes";
import { expectProblem } from "./list-fakes";

const RANGE = { from: "2026-03-01", to: "2026-03-07" };

describe("campaignDetail", () => {
  test("404s for an unknown account without touching the lists", async () => {
    const deps = memoryCampaignDetailDeps({ accountless: true });
    await expectProblem(() => campaignDetail(deps, "acc-404", "cmp-1", {}), 404, "RESOURCE_NOT_FOUND");
    expect(deps.calls.adSets).toHaveLength(0);
    expect(deps.calls.ads).toHaveLength(0);
  });

  test("404s for an unknown campaign", async () => {
    const deps = memoryCampaignDetailDeps();
    await expectProblem(() => campaignDetail(deps, "acc-1", "cmp-404", {}), 404, "RESOURCE_NOT_FOUND");
    expect(deps.calls.adSets).toHaveLength(0);
    expect(deps.calls.ads).toHaveLength(0);
  });

  test("404s for a campaign outside the account", async () => {
    const deps = memoryCampaignDetailDeps({ campaign: campaignEntityRow({ adAccountId: "acc-2" }) });
    await expectProblem(() => campaignDetail(deps, "acc-1", "cmp-1", {}), 404, "RESOURCE_NOT_FOUND");
    expect(deps.calls.adSets).toHaveLength(0);
  });

  test("assembles the campaign header, prev window, series, and funnel", async () => {
    const deps = memoryCampaignDetailDeps({
      campaign: campaignEntityRow(),
      sums: {
        "2026-03-01..2026-03-07": [windowSums()],
        "2026-02-22..2026-02-28": [
          windowSums({
            spend: 70,
            revenue: 140,
            purchases: 1,
            clicks: 5,
            impressions: 500,
            reach: 400,
            landingPageViews: 0,
            addToCart: 0,
            initiateCheckout: 0,
          }),
        ],
      },
      series: [{ date: "2026-03-02", spend: 10, revenue: 20 }],
    });
    const result = await campaignDetail(deps, "acc-1", "cmp-1", RANGE);
    expect(deps.calls.windowMetrics).toEqual([
      { level: "campaign", since: "2026-03-01", until: "2026-03-07" },
      { level: "campaign", since: "2026-02-22", until: "2026-02-28" },
    ]);
    expect(result.adAccountId).toBe("acc-1");
    expect(result.adAccountPlatformId).toBe("act_111");
    expect(result.accountName).toBe("Acme");
    expect(result.campaign).toMatchObject({
      id: "cmp-1",
      name: "Spring Sale",
      status: "ACTIVE",
      currency: "AED",
      spend: 100,
      revenue: 300,
      roas: 3,
      cpa: 50,
      ctr: 1,
      frequency: 2,
    });
    expect(result.prev).toEqual({
      spend: 70,
      revenue: 140,
      purchases: 1,
      roas: 2,
      cpa: 70,
      ctr: 1,
      frequency: 1.25,
    });
    expect(result.series).toHaveLength(7);
    expect(result.series[0]).toEqual({ date: "2026-03-01", spend: 0, revenue: 0, roas: null });
    expect(result.series[1]).toEqual({ date: "2026-03-02", spend: 10, revenue: 20, roas: 2 });
    expect(result.series[6]).toEqual({ date: "2026-03-07", spend: 0, revenue: 0, roas: null });
    expect(result.funnel).toEqual({
      impressions: 1000,
      reach: 500,
      clicks: 10,
      landingPageViews: 40,
      addToCart: 12,
      initiateCheckout: 6,
      purchases: 2,
      revenue: 300,
    });
  });

  test("resolves the default window to the last 30 days", async () => {
    const deps = memoryCampaignDetailDeps({ campaign: campaignEntityRow() });
    await campaignDetail(deps, "acc-1", "cmp-1", {});
    const until = new Date().toISOString().slice(0, 10);
    expect(deps.calls.ads[0]?.until).toBe(until);
    expect(deps.calls.ads[0]?.since).toBe(shiftDate(until, -29));
  });
});
