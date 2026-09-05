import { afterEach, describe, expect, test } from "bun:test";
import { isMediaStale, mediaUrlTtlDays } from "./media-resolver";

const DAY_MS = 86400000;

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
