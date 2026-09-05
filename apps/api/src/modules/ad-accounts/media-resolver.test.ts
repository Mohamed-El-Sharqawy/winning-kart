import { describe, expect, test } from "bun:test";
import {
  ACCOUNT,
  DAY_MS,
  FakeAdapter,
  FakeModel,
  adRow,
  notFoundError,
  row,
  serverError,
} from "./media-resolver.fakes";
import { resolveAdMedia } from "./media-resolver";

describe("resolveAdMedia thumbnails", () => {
  test("warm resolve performs zero adapter calls and no persistence", async () => {
    const model = new FakeModel([row()]);
    const adapter = new FakeAdapter();
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["ad-1"], false);
    expect(adapter.adCalls).toEqual([]);
    expect(adapter.videoCalls).toEqual([]);
    expect(model.calls).toEqual([]);
    expect(items).toEqual([
      {
        adId: "ad-1",
        format: "IMAGE",
        thumbnailUrl: "https://cdn/fresh.jpg",
        videoId: null,
        carouselCount: null,
      },
    ]);
  });

  test("stale thumbnail triggers one batched read and persists the fresh url", async () => {
    const stale = row({
      id: "ad-stale",
      platformAdId: "plat-stale",
      thumbnailUrl: "https://cdn/old.jpg",
      thumbnailResolvedAt: new Date(Date.now() - 8 * DAY_MS),
    });
    const model = new FakeModel([stale]);
    const adapter = new FakeAdapter();
    adapter.adResponse = [adRow("plat-stale", "https://cdn/new.jpg")];
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["ad-stale"], false);
    expect(adapter.adCalls).toEqual([["plat-stale"]]);
    expect(model.calls).toEqual([
      {
        adId: "ad-stale",
        patch: { thumbnailUrl: "https://cdn/new.jpg", thumbnailResolvedAt: expect.any(Date) },
      },
    ]);
    expect(items[0]?.thumbnailUrl).toBe("https://cdn/new.jpg");
  });

  test("missing thumbnail triggers re-resolution; absent graph url persists nothing", async () => {
    const missing = row({
      id: "ad-missing",
      platformAdId: "plat-missing",
      thumbnailUrl: null,
      thumbnailResolvedAt: null,
    });
    const model = new FakeModel([missing]);
    const adapter = new FakeAdapter();
    adapter.adResponse = [
      { id: "plat-missing", adset_id: "adset-1", name: "ad", creative: { id: "c-1" } },
    ];
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["ad-missing"], false);
    expect(adapter.adCalls).toEqual([["plat-missing"]]);
    expect(model.calls).toEqual([]);
    expect(items[0]?.thumbnailUrl).toBeNull();
  });

  test("batches at most 50 platform ids per graph read", async () => {
    const rows = Array.from({ length: 120 }, (_, index) =>
      row({
        id: `ad-${index}`,
        platformAdId: `plat-${index}`,
        thumbnailResolvedAt: new Date(Date.now() - 30 * DAY_MS),
      })
    );
    const model = new FakeModel(rows);
    const adapter = new FakeAdapter();
    await resolveAdMedia(model, ACCOUNT, adapter, rows.map((r) => r.id), false);
    expect(adapter.adCalls.map((ids) => ids.length)).toEqual([50, 50, 20]);
  });

  test("force bypasses the TTL check", async () => {
    const model = new FakeModel([row()]);
    const adapter = new FakeAdapter();
    adapter.adResponse = [adRow("plat-1", "https://cdn/forced.jpg")];
    await resolveAdMedia(model, ACCOUNT, adapter, ["ad-1"], true);
    expect(adapter.adCalls).toEqual([["plat-1"]]);
    expect(model.calls.length).toBe(1);
  });

  test("unknown and out-of-account ids are dropped from the response", async () => {
    const model = new FakeModel([row({ id: "ad-1" })]);
    const adapter = new FakeAdapter();
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["ad-1", "ad-unknown"], false);
    expect(items.map((item) => item.adId)).toEqual(["ad-1"]);
  });

  test("response follows input id order", async () => {
    const model = new FakeModel([row({ id: "a" }), row({ id: "b" }), row({ id: "c" })]);
    const adapter = new FakeAdapter();
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["c", "a"], false);
    expect(items.map((item) => item.adId)).toEqual(["c", "a"]);
  });

  test("thumbnail read upstream failure propagates to the caller", async () => {
    const model = new FakeModel([row({ thumbnailUrl: null, thumbnailResolvedAt: null })]);
    const adapter = new FakeAdapter();
    adapter.adError = serverError();
    expect(
      resolveAdMedia(model, ACCOUNT, adapter, ["ad-1"], false)
    ).rejects.toThrow("upstream exploded");
    adapter.adError = notFoundError();
    expect(
      resolveAdMedia(model, ACCOUNT, adapter, ["ad-1"], false)
    ).rejects.toThrow("node does not exist");
  });
});
