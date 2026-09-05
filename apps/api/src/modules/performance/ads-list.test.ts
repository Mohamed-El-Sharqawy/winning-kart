import { describe, expect, test } from "bun:test";
import { resolveWindow, shiftDate } from "../../lib/window";
import { decodeAdsCursor } from "./ads-cursor";
import { adsListContext, listAdsPage, trendWindows } from "./ads-list";
import type { AdsPageInput } from "./ads-repository";
import { adRow, depsWith, expectProblem, memoryPageAds } from "./ads-list.fakes";

describe("trendWindows", () => {
  test("clamps the trend windows to the selected window", () => {
    const clamped = trendWindows({ since: "2026-08-01", until: "2026-08-30", spanDays: 30 });
    expect(clamped.recentSince).toBe("2026-08-24");
    expect(clamped.priorSince).toBe("2026-08-17");
    const short = trendWindows({ since: "2026-08-25", until: "2026-08-30", spanDays: 6 });
    expect(short.recentSince).toBe("2026-08-25");
    expect(short.priorSince).toBe("2026-08-25");
  });
});

describe("listAdsPage", () => {
  test("404s for an unknown account", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([], recorder), { accountless: true });
    await expectProblem(() => listAdsPage(deps, "acc-404", {}), 404, "RESOURCE_NOT_FOUND");
    expect(recorder).toHaveLength(0);
  });

  test("serves a full page and encodes the continuation cursor", async () => {
    const recorder: AdsPageInput[] = [];
    const rows = [adRow({ id: "a", sortValue: 30 }), adRow({ id: "b", sortValue: 20 }), adRow({ id: "c", sortValue: 10 })];
    const deps = depsWith(memoryPageAds(rows, recorder));
    const result = await listAdsPage(deps, "acc-1", { limit: "2" });
    expect(recorder[0].limit).toBe(3);
    expect(result.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result.items[0].metrics).toEqual({
      spend: 100,
      revenue: 300,
      purchases: 2,
      roas: 3,
      cpa: 50,
      ctr: 1,
      frequency: 2,
    });
    const decoded = decodeAdsCursor(result.nextCursor as string, adsListContext({ limit: "2" }));
    expect(decoded.id).toBe("b");
    expect(decoded.sortValue).toBe(20);
  });

  test("walks to the next page through the cursor and reports exhaustion", async () => {
    const recorder: AdsPageInput[] = [];
    const rows = [adRow({ id: "a", sortValue: 30 }), adRow({ id: "b", sortValue: 20 }), adRow({ id: "c", sortValue: 10 })];
    const deps = depsWith(memoryPageAds(rows, recorder));
    const first = await listAdsPage(deps, "acc-1", { limit: "2" });
    const second = await listAdsPage(deps, "acc-1", { limit: "2", cursor: first.nextCursor as string });
    expect(second.items.map((item) => item.id)).toEqual(["c"]);
    expect(second.nextCursor).toBeNull();
    expect(recorder[1].cursor).toEqual({ id: "b", sortValue: 20 });
    expect(recorder[1].limit).toBe(3);
  });

  test("a null-sort tail pages within itself", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([adRow({ id: "e", sortValue: null, sums: null, spendShare: null })], recorder));
    const first = await listAdsPage(deps, "acc-1", { limit: "2" });
    expect(first.items.map((item) => item.id)).toEqual(["e"]);
    expect(first.items[0].metrics).toBeNull();
    expect(first.nextCursor).toBeNull();
    expect(recorder[0].cursor).toBeNull();
  });

  test("mutating a filter mid-scroll is 422 CURSOR_MISMATCH", async () => {
    const recorder: AdsPageInput[] = [];
    const rows = [adRow({ id: "a", sortValue: 30 }), adRow({ id: "b", sortValue: 20 }), adRow({ id: "c", sortValue: 10 })];
    const deps = depsWith(memoryPageAds(rows, recorder));
    const first = await listAdsPage(deps, "acc-1", { limit: "2" });
    await expectProblem(
      () => listAdsPage(deps, "acc-1", { limit: "2", cursor: first.nextCursor as string, sort: "roas" }),
      422,
      "CURSOR_MISMATCH"
    );
  });

  test("an undecodable cursor is 422 CURSOR_INVALID", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([], recorder));
    await expectProblem(() => listAdsPage(deps, "acc-1", { cursor: "not-a-cursor" }), 422, "CURSOR_INVALID");
  });

  test("unknown filter values are 422 VALIDATION", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([], recorder));
    await expectProblem(() => listAdsPage(deps, "acc-1", { status: "archived" }), 422, "VALIDATION");
    await expectProblem(() => listAdsPage(deps, "acc-1", { limit: "101" }), 422, "VALIDATION");
    await expectProblem(() => listAdsPage(deps, "acc-1", { limit: "1.5" }), 422, "VALIDATION");
    await expectProblem(() => listAdsPage(deps, "acc-1", { flag: "winning" }), 422, "VALIDATION");
  });

  test("passes window bounds and the limit+1 probe to the repository", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([adRow({ id: "a" })], recorder));
    await listAdsPage(deps, "acc-1", { days: "30", limit: "50" });
    const input = recorder[0];
    expect(input.limit).toBe(51);
    const until = new Date().toISOString().slice(0, 10);
    expect(input.until).toBe(until);
    expect(input.since).toBe(shiftDate(until, -29));
    expect(input.recentSince).toBe(shiftDate(until, -6));
    expect(input.priorSince).toBe(shiftDate(until, -13));
  });

  test("re-resolves stale thumbnails inline and serves fresh urls", async () => {
    const recorder: AdsPageInput[] = [];
    const staleResolved = new Date(Date.now() - 30 * 86400000);
    const rows = [
      adRow({ id: "stale", thumbnailUrl: "https://cdn/stale.jpg", thumbnailResolvedAt: staleResolved }),
      adRow({ id: "warm", thumbnailUrl: "https://cdn/warm.jpg", thumbnailResolvedAt: new Date(Date.now() - 86400000) }),
    ];
    const deps = depsWith(memoryPageAds(rows, recorder));
    const result = await listAdsPage(deps, "acc-1", { limit: "2" });
    expect(deps.refresherCalls).toEqual([["stale"]]);
    const byId = new Map(result.items.map((item) => [item.id, item.thumbnailUrl]));
    expect(byId.get("stale")).toBe("https://cdn/fresh-stale.jpg");
    expect(byId.get("warm")).toBe("https://cdn/warm.jpg");
  });

  test("a warm page adds zero refresh calls", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds([adRow({ id: "warm" })], recorder));
    await listAdsPage(deps, "acc-1", { limit: "2" });
    expect(deps.refresherCalls).toEqual([]);
  });
});
