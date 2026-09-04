import { describe, expect, test } from "bun:test";
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH, withThumbnailDimensions } from "./client";

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
