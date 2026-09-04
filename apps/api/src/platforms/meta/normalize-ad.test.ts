import { describe, expect, test } from "bun:test";
import type { MetaAdRow } from "./client";
import { normalizeAd } from "./normalize";

const RESOLVED_AT = new Date("2026-09-04T12:00:00Z");

function adRow(creative: MetaAdRow["creative"]): MetaAdRow {
  return {
    id: "ad-1",
    adset_id: "adset-1",
    name: "Ad one",
    effective_status: "ACTIVE",
    updated_time: "2026-09-04T10:00:00+0000",
    creative,
  };
}

describe("normalizeAd format derivation", () => {
  test("derives VIDEO when creative video_id is present", () => {
    const record = normalizeAd(
      adRow({ id: "c1", video_id: "vid-1", thumbnail_url: "https://cdn/t.jpg" }),
      RESOLVED_AT
    );
    expect(record.format).toBe("VIDEO");
    expect(record.videoId).toBe("vid-1");
    expect(record.carouselCount).toBeNull();
  });

  test("derives CAROUSEL when child_attachments has more than one entry", () => {
    const record = normalizeAd(
      adRow({
        id: "c1",
        object_story_spec: {
          link_data: { child_attachments: [{ id: "a1" }, { id: "a2" }, { id: "a3" }] },
        },
      }),
      RESOLVED_AT
    );
    expect(record.format).toBe("CAROUSEL");
    expect(record.carouselCount).toBe(3);
  });

  test("derives CAROUSEL when template_data is present", () => {
    const record = normalizeAd(
      adRow({
        id: "c1",
        object_story_spec: {
          link_data: { child_attachments: [{ id: "a1" }] },
          template_data: { message: "catalog" },
        },
      }),
      RESOLVED_AT
    );
    expect(record.format).toBe("CAROUSEL");
    expect(record.carouselCount).toBe(1);
  });

  test("template_data without attachments counts zero cards", () => {
    const record = normalizeAd(
      adRow({ id: "c1", object_story_spec: { template_data: { message: "catalog" } } }),
      RESOLVED_AT
    );
    expect(record.format).toBe("CAROUSEL");
    expect(record.carouselCount).toBe(0);
  });

  test("derives IMAGE for a single attachment without template_data", () => {
    const record = normalizeAd(
      adRow({
        id: "c1",
        object_story_spec: { link_data: { child_attachments: [{ id: "a1" }] } },
      }),
      RESOLVED_AT
    );
    expect(record.format).toBe("IMAGE");
    expect(record.carouselCount).toBeNull();
  });

  test("derives IMAGE when creative or object_story_spec is absent", () => {
    expect(normalizeAd(adRow(undefined), RESOLVED_AT).format).toBe("IMAGE");
    expect(normalizeAd(adRow({ id: "c1" }), RESOLVED_AT).format).toBe("IMAGE");
    expect(normalizeAd(adRow({ id: "c1", object_story_spec: {} }), RESOLVED_AT).format).toBe(
      "IMAGE"
    );
  });

  test("VIDEO wins over carousel signals", () => {
    const record = normalizeAd(
      adRow({
        id: "c1",
        video_id: "vid-1",
        object_story_spec: {
          link_data: { child_attachments: [{ id: "a1" }, { id: "a2" }] },
        },
      }),
      RESOLVED_AT
    );
    expect(record.format).toBe("VIDEO");
    expect(record.carouselCount).toBeNull();
  });
});

describe("normalizeAd media fields", () => {
  test("persists creative id, video id, and effective story id", () => {
    const record = normalizeAd(
      adRow({
        id: "c1",
        video_id: "vid-1",
        effective_object_story_id: "story-1",
      }),
      RESOLVED_AT
    );
    expect(record.creativeId).toBe("c1");
    expect(record.videoId).toBe("vid-1");
    expect(record.effectiveStoryId).toBe("story-1");
  });

  test("persists thumbnailUrl and stamps thumbnailResolvedAt", () => {
    const record = normalizeAd(adRow({ id: "c1", thumbnail_url: "https://cdn/t.jpg" }), RESOLVED_AT);
    expect(record.thumbnailUrl).toBe("https://cdn/t.jpg");
    expect(record.thumbnailResolvedAt).toEqual(RESOLVED_AT);
  });

  test("leaves thumbnail fields null when thumbnail_url is absent", () => {
    const record = normalizeAd(adRow({ id: "c1", video_id: "vid-1" }), RESOLVED_AT);
    expect(record.thumbnailUrl).toBeNull();
    expect(record.thumbnailResolvedAt).toBeNull();
  });

  test("keeps status and platform timestamps mapping intact", () => {
    const record = normalizeAd(adRow({ id: "c1" }), RESOLVED_AT);
    expect(record.platformAdId).toBe("ad-1");
    expect(record.adSetPlatformId).toBe("adset-1");
    expect(record.status).toBe("ACTIVE");
    expect(record.platformUpdatedAt).toEqual(new Date("2026-09-04T10:00:00Z"));
  });
});
