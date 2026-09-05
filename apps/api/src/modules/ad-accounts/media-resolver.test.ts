import { afterEach, describe, expect, test } from "bun:test";
import type { MetaAdRow } from "../../platforms/meta";
import type { AdMediaPatch } from "./model";
import {
  isMediaStale,
  mediaUrlTtlDays,
  resolveAdMedia,
  type MediaResolverAdapter,
  type MediaResolverModel,
} from "./media-resolver";

const ACCOUNT: { id: string } = { id: "acc-1" };
const DAY_MS = 86400000;

interface FakeRow {
  id: string;
  platformAdId: string;
  format: "IMAGE" | "VIDEO" | "CAROUSEL" | null;
  videoId: string | null;
  carouselCount: number | null;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: Date | null;
  posterUrl: string | null;
  posterResolvedAt: Date | null;
  sourceUrl: string | null;
  sourceResolvedAt: Date | null;
}

function row(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: "ad-1",
    platformAdId: "plat-1",
    format: "IMAGE",
    videoId: null,
    carouselCount: null,
    thumbnailUrl: "https://cdn/fresh.jpg",
    thumbnailResolvedAt: new Date(Date.now() - DAY_MS),
    posterUrl: null,
    posterResolvedAt: null,
    sourceUrl: null,
    sourceResolvedAt: null,
    ...overrides,
  };
}

class FakeModel implements MediaResolverModel {
  calls: { adId: string; patch: AdMediaPatch }[] = [];

  constructor(private readonly rows: FakeRow[]) {}

  async findAdsMediaByIds(_adAccountId: string, ids: string[]): Promise<FakeRow[]> {
    return this.rows.filter((r) => ids.includes(r.id));
  }

  async updateAdMedia(adId: string, patch: AdMediaPatch): Promise<void> {
    this.calls.push({ adId, patch });
  }
}

class FakeAdapter implements MediaResolverAdapter {
  adCalls: string[][] = [];
  videoCalls: string[] = [];
  adResponse: MetaAdRow[] = [];
  videoResponse = new Map<string, { source?: string; picture?: string }>();
  error: Error | null = null;

  async getAdsByIds(ids: string[]): Promise<MetaAdRow[]> {
    if (this.error !== null) {
      throw this.error;
    }
    this.adCalls.push(ids);
    return this.adResponse;
  }

  async getVideoMedia(videoId: string): Promise<{ source?: string; picture?: string } | null> {
    if (this.error !== null) {
      throw this.error;
    }
    this.videoCalls.push(videoId);
    return this.videoResponse.get(videoId) ?? null;
  }
}

function adRow(platformAdId: string, thumbnailUrl: string): MetaAdRow {
  return {
    id: platformAdId,
    adset_id: "adset-1",
    name: "ad",
    creative: { id: `creative-${platformAdId}`, thumbnail_url: thumbnailUrl },
  };
}

afterEach(() => {
  delete process.env.WK_MEDIA_URL_TTL_DAYS;
});

describe("mediaUrlTtlDays", () => {
  test("defaults to 7", () => {
    expect(mediaUrlTtlDays()).toBe(7);
  });

  test("clamps to 1-30", () => {
    process.env.WK_MEDIA_URL_TTL_DAYS = "0";
    expect(mediaUrlTtlDays()).toBe(1);
    process.env.WK_MEDIA_URL_TTL_DAYS = "99";
    expect(mediaUrlTtlDays()).toBe(30);
    process.env.WK_MEDIA_URL_TTL_DAYS = "12";
    expect(mediaUrlTtlDays()).toBe(12);
  });
});

describe("isMediaStale", () => {
  const now = new Date("2026-09-05T00:00:00Z");

  test("missing url or resolvedAt is stale", () => {
    expect(isMediaStale(null, now, now, 7)).toBe(true);
    expect(isMediaStale("https://cdn/x.jpg", null, now, 7)).toBe(true);
  });

  test("age at or past TTL is stale, younger is fresh", () => {
    const exactlyTtl = new Date(now.getTime() - 7 * DAY_MS);
    const younger = new Date(now.getTime() - 7 * DAY_MS + 1000);
    expect(isMediaStale("https://cdn/x.jpg", exactlyTtl, now, 7)).toBe(true);
    expect(isMediaStale("https://cdn/x.jpg", younger, now, 7)).toBe(false);
  });
});

describe("resolveAdMedia", () => {
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
    adapter.adResponse = [];
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

  test("stale poster and source resolve via the video node and persist", async () => {
    const videoAd = row({
      id: "ad-video",
      platformAdId: "plat-video",
      format: "VIDEO",
      videoId: "vid-1",
      posterUrl: "https://cdn/old-poster.jpg",
      posterResolvedAt: new Date(Date.now() - 9 * DAY_MS),
      sourceUrl: "https://cdn/old-source.mp4",
      sourceResolvedAt: new Date(Date.now() - 9 * DAY_MS),
    });
    const model = new FakeModel([videoAd]);
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
    const videoAd = row({
      id: "ad-video",
      format: "VIDEO",
      videoId: "vid-1",
      posterUrl: "https://cdn/poster.jpg",
      posterResolvedAt: new Date(Date.now() - DAY_MS),
      sourceUrl: "https://cdn/source.mp4",
      sourceResolvedAt: new Date(Date.now() - DAY_MS),
    });
    const model = new FakeModel([videoAd]);
    const adapter = new FakeAdapter();
    await resolveAdMedia(model, ACCOUNT, adapter, ["ad-video"], false);
    expect(adapter.videoCalls).toEqual([]);
  });

  test("ads sharing one video resolve it with a single video-node call", async () => {
    const shared = {
      posterUrl: null,
      posterResolvedAt: null,
      sourceUrl: null,
      sourceResolvedAt: null,
    };
    const rows = [
      row({ id: "ad-1", videoId: "vid-1", format: "VIDEO", thumbnailResolvedAt: new Date(Date.now() - DAY_MS), ...shared }),
      row({ id: "ad-2", platformAdId: "plat-2", videoId: "vid-1", format: "VIDEO", thumbnailResolvedAt: new Date(Date.now() - DAY_MS), ...shared }),
    ];
    const model = new FakeModel(rows);
    const adapter = new FakeAdapter();
    adapter.videoResponse.set("vid-1", { source: "https://cdn/s.mp4", picture: "https://cdn/p.jpg" });
    await resolveAdMedia(model, ACCOUNT, adapter, ["ad-1", "ad-2"], false);
    expect(adapter.videoCalls).toEqual(["vid-1"]);
    expect(model.calls.length).toBe(2);
  });

  test("adapter failures propagate to the caller", async () => {
    const model = new FakeModel([
      row({ thumbnailUrl: null, thumbnailResolvedAt: null }),
    ]);
    const adapter = new FakeAdapter();
    adapter.error = new Error("boom");
    expect(resolveAdMedia(model, ACCOUNT, adapter, ["ad-1"], false)).rejects.toThrow("boom");
  });
});
