import { describe, expect, test } from "bun:test";
import { shiftDate } from "../../lib/window";
import { adSetDbRow, campaignDbRow, expectProblem, memoryListDeps } from "./list-fakes";
import { adSetsPage, adSetsSummary, campaignsPage, campaignsSummary } from "./list-service";

describe("campaignsPage", () => {
  test("404s for an unknown account without touching the repository", async () => {
    const deps = memoryListDeps({ accountless: true });
    await expectProblem(() => campaignsPage(deps, "acc-404", {}), 404, "RESOURCE_NOT_FOUND");
    expect(deps.calls.campaigns).toHaveLength(0);
  });

  test("serves a numbered page with the full envelope", async () => {
    const deps = memoryListDeps({ campaigns: [campaignDbRow()], campaignTotal: 3 });
    const result = await campaignsPage(deps, "acc-1", { page: "2", pageSize: "1", status: "all", q: "eid" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(1);
    expect(result.total).toBe(3);
    expect(result.items.map((item) => item.id)).toEqual(["cmp-1"]);
    const input = deps.calls.campaigns[0];
    expect(input.page).toBe(2);
    expect(input.pageSize).toBe(1);
    expect(input.statuses).toHaveLength(11);
    expect(input.q).toBe("eid");
    expect(input.sort).toBe("spend");
    expect(input.order).toBe("desc");
  });

  test("a page beyond range returns empty items with total intact", async () => {
    const deps = memoryListDeps({ campaigns: [], campaignTotal: 7 });
    const result = await campaignsPage(deps, "acc-1", { page: "9", pageSize: "25" });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(7);
    expect(result.page).toBe(9);
  });

  test("resolves the default window to the last 30 days", async () => {
    const deps = memoryListDeps({ campaigns: [campaignDbRow()] });
    await campaignsPage(deps, "acc-1", {});
    const input = deps.calls.campaigns[0];
    const until = new Date().toISOString().slice(0, 10);
    expect(input.until).toBe(until);
    expect(input.since).toBe(shiftDate(until, -29));
  });

  test("invalid query values are 422 VALIDATION before the repository runs", async () => {
    const deps = memoryListDeps({ campaigns: [campaignDbRow()] });
    await expectProblem(() => campaignsPage(deps, "acc-1", { status: "archived" }), 422, "VALIDATION");
    await expectProblem(() => campaignsPage(deps, "acc-1", { sort: "cpa" }), 422, "VALIDATION");
    await expectProblem(() => campaignsPage(deps, "acc-1", { order: "up" }), 422, "VALIDATION");
    await expectProblem(() => campaignsPage(deps, "acc-1", { pageSize: "101" }), 422, "VALIDATION");
    await expectProblem(() => campaignsPage(deps, "acc-1", { page: "0" }), 422, "VALIDATION");
    expect(deps.calls.campaigns).toHaveLength(0);
  });

  test("an invalid window is 422 INVALID_WINDOW", async () => {
    const deps = memoryListDeps({ campaigns: [] });
    await expectProblem(
      () => campaignsPage(deps, "acc-1", { from: "2026-03-05", to: "2026-03-01" }),
      422,
      "INVALID_WINDOW"
    );
    expect(deps.calls.campaigns).toHaveLength(0);
  });
});

describe("adSetsPage", () => {
  test("forwards the campaignId filter and serves the same envelope", async () => {
    const deps = memoryListDeps({ adSets: [adSetDbRow()], adSetTotal: 1 });
    const result = await adSetsPage(deps, "acc-1", { campaignId: "cmp-9", sort: "roas", order: "asc" });
    expect(result.items.map((item) => item.id)).toEqual(["set-1"]);
    const input = deps.calls.adSets[0];
    expect(input.campaignId).toBe("cmp-9");
    expect(input.sort).toBe("roas");
    expect(input.order).toBe("asc");
  });

  test("404s for an unknown account", async () => {
    const deps = memoryListDeps({ accountless: true });
    await expectProblem(() => adSetsPage(deps, "acc-404", {}), 404, "RESOURCE_NOT_FOUND");
    expect(deps.calls.adSets).toHaveLength(0);
  });
});

describe("summaries", () => {
  test("campaigns summary mirrors the list filters and derives the seven metrics", async () => {
    const deps = memoryListDeps({
      campaignSummary: { spend: 400, revenue: 900, purchases: 4, clicks: 40, impressions: 4000, reach: 1000 },
    });
    const result = await campaignsSummary(deps, "acc-1", { status: "inactive", q: "retired", days: "7" });
    expect(result).toEqual({
      spend: 400,
      revenue: 900,
      purchases: 4,
      roas: 2.25,
      cpa: 100,
      ctr: 1,
      frequency: 4,
    });
    const input = deps.calls.campaignSummaries[0];
    expect(input.statuses).not.toContain("ACTIVE");
    expect(input.q).toBe("retired");
    expect(input.campaignId).toBeNull();
  });

  test("ad sets summary carries the campaignId filter", async () => {
    const deps = memoryListDeps({
      adSetSummary: { spend: 10, revenue: 0, purchases: 0, clicks: 1, impressions: 100, reach: 50 },
    });
    const result = await adSetsSummary(deps, "acc-1", { campaignId: "cmp-3" });
    expect(result.spend).toBe(10);
    expect(result.roas).toBe(0);
    expect(result.cpa).toBeNull();
    expect(deps.calls.adSetSummaries[0].campaignId).toBe("cmp-3");
  });

  test("both summaries 404 for an unknown account", async () => {
    const deps = memoryListDeps({ accountless: true });
    await expectProblem(() => campaignsSummary(deps, "acc-404", {}), 404, "RESOURCE_NOT_FOUND");
    await expectProblem(() => adSetsSummary(deps, "acc-404", {}), 404, "RESOURCE_NOT_FOUND");
    expect(deps.calls.campaignSummaries).toHaveLength(0);
    expect(deps.calls.adSetSummaries).toHaveLength(0);
  });
});
