import { describe, expect, test } from "bun:test";
import { listAdsPage } from "./ads-list";
import type { AdsPageInput } from "./ads-repository";
import { adRow, depsWith, memoryPageAds, pausedRow } from "./ads-list.fakes";

function dataset(pausedCount: number, activeCount: number, withTail: boolean) {
  const rows = [];
  for (let index = 0; index < pausedCount; index += 1) {
    rows.push(pausedRow(`paused-${index}`, 500 - index));
  }
  for (let index = 0; index < activeCount; index += 1) {
    rows.push(adRow({ id: `active-${index}`, sortValue: 500 - index - pausedCount }));
  }
  if (withTail) {
    rows.push(pausedRow("paused-tail", null));
  }
  return rows;
}

describe("listAdsPage flag scan", () => {
  test("flag filtering scans chunks and returns only matching rows", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds(dataset(2, 498, true), recorder));
    const result = await listAdsPage(deps, "acc-1", { flag: "status_anomaly" });
    expect(recorder).toHaveLength(2);
    expect(recorder[0].limit).toBe(500);
    expect(recorder[1].cursor).toEqual({ id: "active-497", sortValue: 1 });
    expect(result.items.map((item) => item.id)).toEqual(["paused-0", "paused-1", "paused-tail"]);
    expect(result.items.every((item) => item.fatigue?.flag === "status_anomaly")).toBe(true);
    expect(result.nextCursor).toBeNull();
  });

  test("a full flag page reports continuation from the last match", async () => {
    const recorder: AdsPageInput[] = [];
    const deps = depsWith(memoryPageAds(dataset(3, 497, false), recorder));
    const first = await listAdsPage(deps, "acc-1", { flag: "status_anomaly", limit: "2" });
    expect(first.items.map((item) => item.id)).toEqual(["paused-0", "paused-1"]);
    const second = await listAdsPage(deps, "acc-1", {
      flag: "status_anomaly",
      limit: "2",
      cursor: first.nextCursor as string,
    });
    expect(second.items.map((item) => item.id)).toEqual(["paused-2"]);
    expect(second.nextCursor).toBeNull();
    expect(recorder[1].cursor).toEqual({ id: "paused-1", sortValue: 499 });
  });
});
