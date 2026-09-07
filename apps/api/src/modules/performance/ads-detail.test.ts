import { describe, expect, test } from "bun:test";
import { adsManagerUrl, adDetail, videoEmbedUrl } from "./ads-detail";
import type { AdDetailDeps } from "./ads-detail";
import type { ResolvedWindow } from "../../lib/window";
import type { AdsRow } from "./ads-decoration";
import type { ResolvedMediaItem } from "../ad-accounts/media-resolver";
import { adRow, expectProblem } from "./ads-list.fakes";

function resolvedItem(overrides: Partial<ResolvedMediaItem> = {}): ResolvedMediaItem {
  return {
    adId: "ad-1",
    format: "IMAGE",
    thumbnailUrl: "https://cdn/thumb.jpg",
    imageUrl: null,
    videoId: null,
    carouselCount: null,
    posterUrl: null,
    sourceUrl: null,
    ...overrides,
  };
}

function detailDeps(
  account: { id: string; adAccountId: string } | undefined,
  ad: AdsRow | undefined,
  resolved: ResolvedMediaItem[] = []
): AdDetailDeps & { findCalls: string[][]; windows: ResolvedWindow[]; resolveCalls: string[][] } {
  const findCalls: string[][] = [];
  const windows: ResolvedWindow[] = [];
  const resolveCalls: string[][] = [];
  return {
    findAccount: async (id) => (id === account?.id ? account : undefined),
    findAd: async (accountId, adId, window) => {
      findCalls.push([accountId, adId]);
      windows.push(window);
      return ad;
    },
    refresher: {
      resolve: async (ids) => {
        resolveCalls.push(ids);
        return resolved;
      },
    },
    findCalls,
    windows,
    resolveCalls,
  };
}

describe("adsManagerUrl", () => {
  test("builds the deep link from the act id and platform ad id", () => {
    expect(adsManagerUrl("act_1234567890", "987654321")).toBe(
      "https://www.facebook.com/adsmanager/manage/campaigns?act=1234567890&selected_ad_ids=987654321"
    );
    expect(adsManagerUrl("1234567890", "111")).toBe(
      "https://www.facebook.com/adsmanager/manage/campaigns?act=1234567890&selected_ad_ids=111"
    );
  });
});

describe("videoEmbedUrl", () => {
  test("builds the public player embed from the stored video id", () => {
    expect(videoEmbedUrl("4489160867997724")).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D4489160867997724&show_text=false"
    );
  });
});

describe("adDetail", () => {
  test("404s for an unknown account or ad id without resolving media", async () => {
    const accountless = detailDeps(undefined, adRow());
    await expectProblem(() => adDetail(accountless, "acc-404", "ad-1"), 404, "RESOURCE_NOT_FOUND");
    expect(accountless.findCalls).toHaveLength(0);
    expect(accountless.resolveCalls).toHaveLength(0);
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, undefined);
    await expectProblem(() => adDetail(deps, "acc-1", "ad-missing"), 404, "RESOURCE_NOT_FOUND");
    expect(deps.findCalls).toEqual([["acc-1", "ad-missing"]]);
    expect(deps.resolveCalls).toHaveLength(0);
  });

  test("serves the embed url for video ads and null for image ads", async () => {
    const videoDeps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, adRow({ format: "VIDEO", videoId: "vid-1" }));
    const videoDetail = await adDetail(videoDeps, "acc-1", "ad-1");
    expect(videoDetail.embedUrl).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3Dvid-1&show_text=false"
    );
    const imageDeps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, adRow({ format: "IMAGE" }));
    const imageDetail = await adDetail(imageDeps, "acc-1", "ad-1");
    expect(imageDetail.embedUrl).toBeNull();
  });

  test("serves the decorated AdItem with context and the Ads Manager deep link", async () => {
    const row = adRow({ platformAdId: "plat-1" });
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1234567890" }, row);
    const detail = await adDetail(deps, "acc-1", "ad-1");
    expect(detail.adSetId).toBe("adset-1");
    expect(detail.adSetName).toBe("Ad Set 1");
    expect(detail.campaignId).toBe("cmp-1");
    expect(detail.campaignName).toBe("Campaign 1");
    expect(detail.metrics?.roas).toBe(3);
    expect(detail.fatigue).toBeNull();
    expect(detail.posterUrl).toBeNull();
    expect(detail.sourceUrl).toBeNull();
    expect(detail.adsManagerUrl).toBe(
      "https://www.facebook.com/adsmanager/manage/campaigns?act=1234567890&selected_ad_ids=plat-1"
    );
  });

  test("re-resolves stale media and serves the fresh urls", async () => {
    const row = adRow({
      format: "VIDEO",
      videoId: "vid-1",
      thumbnailUrl: "https://cdn/stale.jpg",
      thumbnailResolvedAt: new Date(Date.now() - 30 * 86400000),
      imageResolvedAt: new Date(Date.now() - 30 * 86400000),
    });
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, row, [
      resolvedItem({
        adId: "ad-1",
        format: "VIDEO",
        videoId: "vid-1",
        thumbnailUrl: "https://cdn/fresh-thumb.jpg",
        imageUrl: "https://cdn/fresh-full.jpg",
        posterUrl: "https://cdn/fresh-poster.jpg",
        sourceUrl: "https://cdn/fresh-source.mp4",
      }),
    ]);
    const detail = await adDetail(deps, "acc-1", "ad-1");
    expect(deps.resolveCalls).toEqual([["ad-1"]]);
    expect(detail.thumbnailUrl).toBe("https://cdn/fresh-thumb.jpg");
    expect(detail.imageUrl).toBe("https://cdn/fresh-full.jpg");
    expect(detail.posterUrl).toBe("https://cdn/fresh-poster.jpg");
    expect(detail.sourceUrl).toBe("https://cdn/fresh-source.mp4");
  });

  test("serves the stored full-size image for a warm image ad", async () => {
    const deps = detailDeps(
      { id: "acc-1", adAccountId: "act_1" },
      adRow({ imageUrl: "https://cdn/full.jpg" })
    );
    const detail = await adDetail(deps, "acc-1", "ad-1");
    expect(deps.resolveCalls).toHaveLength(0);
    expect(detail.imageUrl).toBe("https://cdn/full.jpg");
    expect(detail.thumbnailUrl).toBe("https://cdn/thumb.jpg");
  });

  test("a never-attempted image resolution triggers one resolve pass", async () => {
    const deps = detailDeps(
      { id: "acc-1", adAccountId: "act_1" },
      adRow({ imageResolvedAt: null })
    );
    await adDetail(deps, "acc-1", "ad-1");
    expect(deps.resolveCalls).toEqual([["ad-1"]]);
  });

  test("a warm ad adds zero resolver calls and serves the stored urls", async () => {
    const row = adRow({
      format: "VIDEO",
      videoId: "vid-1",
      posterUrl: "https://cdn/poster.jpg",
      posterResolvedAt: new Date(Date.now() - 86400000),
      sourceUrl: "https://cdn/source.mp4",
      sourceResolvedAt: new Date(Date.now() - 86400000),
    });
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, row);
    const detail = await adDetail(deps, "acc-1", "ad-1");
    expect(deps.resolveCalls).toHaveLength(0);
    expect(detail.thumbnailUrl).toBe("https://cdn/thumb.jpg");
    expect(detail.posterUrl).toBe("https://cdn/poster.jpg");
    expect(detail.sourceUrl).toBe("https://cdn/source.mp4");
  });

  test("skips the video-node refresh for image ads even when poster fields are empty", async () => {
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, adRow({ format: "IMAGE" }));
    const detail = await adDetail(deps, "acc-1", "ad-1");
    expect(deps.resolveCalls).toHaveLength(0);
    expect(detail.posterUrl).toBeNull();
  });

  test("a video ad with fresh attempt stamps and absent media is warm", async () => {
    const row = adRow({
      format: "VIDEO",
      videoId: "vid-1",
      posterUrl: null,
      posterResolvedAt: new Date(Date.now() - 86400000),
      sourceUrl: null,
      sourceResolvedAt: new Date(Date.now() - 86400000),
    });
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, row);
    const detail = await adDetail(deps, "acc-1", "ad-1");
    expect(deps.resolveCalls).toHaveLength(0);
    expect(detail.posterUrl).toBeNull();
    expect(detail.sourceUrl).toBeNull();
  });

  test("resolves the window from query params", async () => {
    const deps = detailDeps({ id: "acc-1", adAccountId: "act_1" }, adRow());
    await adDetail(deps, "acc-1", "ad-1");
    expect(deps.windows[0].spanDays).toBe(30);
    await adDetail(deps, "acc-1", "ad-1", { days: "7" });
    expect(deps.windows[1].spanDays).toBe(7);
    await expectProblem(
      () => adDetail(deps, "acc-1", "ad-1", { from: "2026-13-99", to: "2026-09-01" }),
      422,
      "INVALID_WINDOW"
    );
  });
});
