import { describe, expect, test } from "bun:test";
import {
  ACCOUNT,
  DAY_MS,
  FakeAdapter,
  FakeModel,
  notFoundError,
  row,
  serverError,
} from "./media-resolver.fakes";
import { resolveAdMedia } from "./media-resolver";

function videoRow(overrides: Record<string, unknown> = {}) {
  return row({
    id: "ad-video",
    platformAdId: "plat-video",
    format: "VIDEO",
    videoId: "vid-1",
    ...overrides,
  });
}

describe("resolveAdMedia video poster and source", () => {
  test("stale poster and source resolve via the video node and persist", async () => {
    const stale = videoRow({
      posterUrl: "https://cdn/old-poster.jpg",
      posterResolvedAt: new Date(Date.now() - 9 * DAY_MS),
      sourceUrl: "https://cdn/old-source.mp4",
      sourceResolvedAt: new Date(Date.now() - 9 * DAY_MS),
    });
    const model = new FakeModel([stale]);
    const adapter = new FakeAdapter();
    adapter.videoResponse.set("vid-1", {
      source: "https://cdn/new-source.mp4",
      picture: "https://cdn/new-poster.jpg",
    });
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["ad-video"], false);
    expect(adapter.videoCalls).toEqual(["vid-1"]);
    expect(model.calls).toEqual([
      {
        adId: "ad-video",
        patch: {
          posterUrl: "https://cdn/new-poster.jpg",
          posterResolvedAt: expect.any(Date),
          sourceUrl: "https://cdn/new-source.mp4",
          sourceResolvedAt: expect.any(Date),
        },
      },
    ]);
    expect(items[0]?.videoId).toBe("vid-1");
  });

  test("fresh video media makes no video-node calls", async () => {
    const fresh = videoRow({
      posterUrl: "https://cdn/poster.jpg",
      posterResolvedAt: new Date(Date.now() - DAY_MS),
      sourceUrl: "https://cdn/source.mp4",
      sourceResolvedAt: new Date(Date.now() - DAY_MS),
    });
    const model = new FakeModel([fresh]);
    const adapter = new FakeAdapter();
    await resolveAdMedia(model, ACCOUNT, adapter, ["ad-video"], false);
    expect(adapter.videoCalls).toEqual([]);
    expect(model.calls).toEqual([]);
  });

  test("ads sharing one video resolve it with a single video-node call", async () => {
    const noMedia = {
      posterUrl: null,
      posterResolvedAt: null,
      sourceUrl: null,
      sourceResolvedAt: null,
    };
    const rows = [
      videoRow({ id: "ad-1", thumbnailResolvedAt: new Date(Date.now() - DAY_MS), ...noMedia }),
      videoRow({
        id: "ad-2",
        platformAdId: "plat-2",
        videoId: "vid-1",
        thumbnailResolvedAt: new Date(Date.now() - DAY_MS),
        ...noMedia,
      }),
    ];
    const model = new FakeModel(rows);
    const adapter = new FakeAdapter();
    adapter.videoResponse.set("vid-1", { source: "https://cdn/s.mp4", picture: "https://cdn/p.jpg" });
    await resolveAdMedia(model, ACCOUNT, adapter, ["ad-1", "ad-2"], false);
    expect(adapter.videoCalls).toEqual(["vid-1"]);
    expect(model.calls.length).toBe(2);
  });

  test("a deleted video node is skipped without failing the resolve", async () => {
    const stale = videoRow({
      posterUrl: null,
      posterResolvedAt: null,
      sourceUrl: null,
      sourceResolvedAt: null,
    });
    const model = new FakeModel([stale]);
    const adapter = new FakeAdapter();
    adapter.videoError = notFoundError();
    const items = await resolveAdMedia(model, ACCOUNT, adapter, ["ad-video"], false);
    expect(adapter.videoCalls).toEqual(["vid-1"]);
    expect(model.calls).toEqual([]);
    expect(items[0]?.adId).toBe("ad-video");
  });

  test("video node upstream failure propagates to the caller", async () => {
    const stale = videoRow({
      posterUrl: null,
      posterResolvedAt: null,
      sourceUrl: null,
      sourceResolvedAt: null,
    });
    const model = new FakeModel([stale]);
    const adapter = new FakeAdapter();
    adapter.videoError = serverError();
    expect(
      resolveAdMedia(model, ACCOUNT, adapter, ["ad-video"], false)
    ).rejects.toThrow("upstream exploded");
  });
});
