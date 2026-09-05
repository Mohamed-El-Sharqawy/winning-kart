import { describe, expect, test } from "bun:test";
import {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
  adResolveBatchEntries,
  flattenBatchBody,
  withThumbnailDimensions,
} from "./client";

describe("withThumbnailDimensions", () => {
  test("adds 512x640 params to requests carrying thumbnail_url", () => {
    const params = withThumbnailDimensions({
      fields: "id,creative{thumbnail_url}",
      limit: "100",
    });
    expect(params.thumbnail_width).toBe(THUMBNAIL_WIDTH);
    expect(params.thumbnail_height).toBe(THUMBNAIL_HEIGHT);
    expect(params.fields).toBe("id,creative{thumbnail_url}");
  });

  test("leaves other requests untouched", () => {
    const params = {
      fields: "id,adset_id,name,status,effective_status,updated_time",
      limit: "100",
    };
    expect(withThumbnailDimensions(params)).toEqual(params);
  });
});

describe("adResolveBatchEntries", () => {
  test("builds one relative url per id with resolve fields and thumbnail dimensions", () => {
    const entries = adResolveBatchEntries(["111", "222"]);
    expect(entries).toHaveLength(2);
    const url = new URL(`https://graph.facebook.com/v21.0/${entries[0]}`);
    expect(url.pathname).toBe("/v21.0/111");
    expect(url.searchParams.get("fields")).toContain("creative{id,thumbnail_url");
    expect(url.searchParams.get("thumbnail_width")).toBe(THUMBNAIL_WIDTH);
    expect(url.searchParams.get("thumbnail_height")).toBe(THUMBNAIL_HEIGHT);
  });
});

describe("flattenBatchBody", () => {
  test("keeps only successful sub-responses with an id", () => {
    const rows = flattenBatchBody<{ id: string; name: string }>([
      { code: 200, body: JSON.stringify({ id: "111", name: "ad" }) },
      { code: 400, body: JSON.stringify({ error: { message: "gone" } }) },
      { code: 200, body: "not-json" },
      null,
    ]);
    expect(rows).toEqual([{ id: "111", name: "ad" }]);
  });

  test("returns empty for non-array bodies", () => {
    expect(flattenBatchBody(null)).toEqual([]);
    expect(flattenBatchBody({})).toEqual([]);
  });
});
