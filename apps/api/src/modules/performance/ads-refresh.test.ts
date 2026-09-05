import { describe, expect, test } from "bun:test";
import { DAY_MS } from "../ad-accounts/media-resolver.fakes";
import type { ResolvedMediaItem } from "../ad-accounts/media-resolver";
import {
  applyThumbnailRefresh,
  refreshPageThumbnails,
  staleThumbnailIds,
} from "./ads-refresh";

class FakeRefresher {
  calls: string[][] = [];
  response: ResolvedMediaItem[] = [];
  error: Error | null = null;

  resolve(ids: string[]): Promise<ResolvedMediaItem[]> {
    if (this.error !== null) {
      return Promise.reject(this.error);
    }
    this.calls.push(ids);
    return Promise.resolve(this.response);
  }
}

describe("staleThumbnailIds", () => {
  test("picks stale and missing thumbnails", () => {
    const now = new Date();
    const ids = staleThumbnailIds(
      [
        { id: "warm", thumbnailUrl: "https://cdn/warm.jpg", thumbnailResolvedAt: new Date(now.getTime() - DAY_MS) },
        { id: "old", thumbnailUrl: "https://cdn/old.jpg", thumbnailResolvedAt: new Date(now.getTime() - 30 * DAY_MS) },
        { id: "missing", thumbnailUrl: null, thumbnailResolvedAt: null },
      ],
      now,
      7
    );
    expect(ids).toEqual(["old", "missing"]);
  });

  test("a warm page has no stale ids", () => {
    const now = new Date();
    expect(
      staleThumbnailIds(
        [{ id: "warm", thumbnailUrl: "https://cdn/warm.jpg", thumbnailResolvedAt: new Date(now.getTime() - DAY_MS) }],
        now,
        7
      )
    ).toEqual([]);
  });
});

describe("refreshPageThumbnails", () => {
  test("makes no resolve calls on a warm page", async () => {
    const refresher = new FakeRefresher();
    const resolutions = await refreshPageThumbnails(
      refresher,
      [{ id: "ad-1", thumbnailUrl: "https://cdn/fresh.jpg", thumbnailResolvedAt: new Date(Date.now() - DAY_MS) }],
      new Date()
    );
    expect(refresher.calls).toEqual([]);
    expect(resolutions.size).toBe(0);
  });

  test("re-resolves stale thumbnails and returns fresh urls", async () => {
    const refresher = new FakeRefresher();
    refresher.response = [{ adId: "ad-1", format: "IMAGE", thumbnailUrl: "https://cdn/new.jpg", videoId: null, carouselCount: null }];
    const resolutions = await refreshPageThumbnails(
      refresher,
      [{ id: "ad-1", thumbnailUrl: null, thumbnailResolvedAt: null }],
      new Date()
    );
    expect(refresher.calls).toHaveLength(1);
    expect(refresher.calls[0]).toEqual(["ad-1"]);
    expect(resolutions.get("ad-1")).toBe("https://cdn/new.jpg");
  });

  test("propagates resolver failures to the caller", async () => {
    const refresher = new FakeRefresher();
    refresher.error = new Error("upstream down");
    expect(
      refreshPageThumbnails(
        refresher,
        [{ id: "ad-1", thumbnailUrl: null, thumbnailResolvedAt: null }],
        new Date()
      )
    ).rejects.toThrow("upstream down");
  });
});

describe("applyThumbnailRefresh", () => {
  test("merges refreshed urls onto items by id", () => {
    const items = [
      { id: "a", thumbnailUrl: "https://cdn/stale.jpg" },
      { id: "b", thumbnailUrl: "https://cdn/warm.jpg" },
    ];
    const merged = applyThumbnailRefresh(items, new Map([["a", "https://cdn/new.jpg"]]));
    expect(merged[0].thumbnailUrl).toBe("https://cdn/new.jpg");
    expect(merged[1].thumbnailUrl).toBe("https://cdn/warm.jpg");
  });
});
