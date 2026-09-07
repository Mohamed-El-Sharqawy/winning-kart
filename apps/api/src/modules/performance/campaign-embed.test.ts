import { describe, expect, test } from "bun:test";
import { trendWindows } from "./ads-list";
import { adRow } from "./ads-list.fakes";
import { embeddedAds, embeddedAdSets } from "./campaign-embed";
import { memoryCampaignDetailDeps } from "./campaign-detail.fakes";
import { adSetDbRow } from "./list-fakes";
import { LIST_PAGE_MAX } from "./list-query";

const RANGE = { since: "2026-03-01", until: "2026-03-07", spanDays: 7 };

describe("embeddedAdSets", () => {
  test("uses the shared ad-sets list query: active only, spend desc, campaign scoped", async () => {
    const deps = memoryCampaignDetailDeps({ adSets: [adSetDbRow({ id: "set-9" })] });
    const result = await embeddedAdSets(deps, "acc-1", "cmp-1", RANGE);
    const input = deps.calls.adSets[0];
    expect(input.statuses).toEqual(["ACTIVE"]);
    expect(input.campaignId).toBe("cmp-1");
    expect(input.q).toBeNull();
    expect(input.sort).toBe("spend");
    expect(input.order).toBe("desc");
    expect(input.page).toBe(1);
    expect(input.pageSize).toBe(LIST_PAGE_MAX);
    expect(input.since).toBe("2026-03-01");
    expect(input.until).toBe("2026-03-07");
    expect(result.map((item) => item.id)).toEqual(["set-9"]);
    expect(result[0]?.spend).toBe(100);
    expect(result[0]?.campaignName).toBe("Campaign 1");
  });
});

describe("embeddedAds", () => {
  test("uses the shared ads list query: top 10, active only, spend desc, campaign scoped", async () => {
    const deps = memoryCampaignDetailDeps({ ads: [adRow()] });
    const result = await embeddedAds(deps, "acc-1", "cmp-1", RANGE);
    const input = deps.calls.ads[0];
    expect(input.limit).toBe(10);
    expect(input.cursor).toBeNull();
    expect(input.sort).toBe("spend");
    expect(input.order).toBe("desc");
    expect(input.filters.statuses).toEqual(["ACTIVE"]);
    expect(input.filters.campaignId).toBe("cmp-1");
    expect(input.filters.adSetId).toBeNull();
    expect(input.filters.flag).toBeNull();
    expect(input.filters.format).toBeNull();
    expect(input.filters.q).toBeNull();
    const trend = trendWindows(RANGE);
    expect(input.recentSince).toBe(trend.recentSince);
    expect(input.priorSince).toBe(trend.priorSince);
    expect(result).toEqual([
      {
        id: "ad-1",
        adSetId: "adset-1",
        adSetName: "Ad Set 1",
        campaignName: "Campaign 1",
        platformAdId: "plat-1",
        name: "Ad 1",
        status: "ACTIVE",
        format: "IMAGE",
        creativeId: "cre-1",
        thumbnailUrl: "https://cdn/thumb.jpg",
        bodyCopy: "Buy flowers",
        spend: 100,
        revenue: 300,
        purchases: 2,
        roas: 3,
        cpa: 50,
        ctr: 1,
        frequency: 2,
        spendShare: 0.25,
        fatigue: null,
      },
    ]);
  });

  test("classifies fatigue through the shared single rule definition", async () => {
    const deps = memoryCampaignDetailDeps({
      ads: [
        adRow({
          sums: { spend: 100, revenue: 50, purchases: 2, clicks: 10, impressions: 1000, reach: 500 },
          spendShare: 0.3,
        }),
      ],
    });
    const result = await embeddedAds(deps, "acc-1", "cmp-1", RANGE);
    expect(result[0]?.fatigue?.flag).toBe("bleeding");
  });

  test("re-resolves stale thumbnails inline like the tab", async () => {
    const deps = memoryCampaignDetailDeps({
      ads: [adRow({ thumbnailResolvedAt: null })],
    });
    const result = await embeddedAds(deps, "acc-1", "cmp-1", RANGE);
    expect(result[0]?.thumbnailUrl).toBe("https://cdn/fresh-ad-1.jpg");
  });
});
