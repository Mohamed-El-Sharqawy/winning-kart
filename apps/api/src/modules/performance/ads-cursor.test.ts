import { describe, expect, test } from "bun:test";
import { ProblemError } from "../../lib/problem";
import { adsCursorContext, decodeAdsCursor, encodeAdsCursor } from "./ads-cursor";

function context(sort: string, order: string): string {
  return adsCursorContext({
    statuses: ["ACTIVE"],
    adSetId: null,
    campaignId: null,
    flag: null,
    format: null,
    q: null,
    sort,
    order,
    limit: 50,
    since: "2026-08-07",
    until: "2026-09-06",
  });
}

function invalid(run: () => unknown): ProblemError {
  try {
    run();
  } catch (error) {
    return error as ProblemError;
  }
  throw new Error("expected a ProblemError");
}

describe("ads cursor", () => {
  test("roundtrips id and sort value", () => {
    const ctx = context("spend", "desc");
    const token = encodeAdsCursor("ad-9", 12.34, ctx);
    expect(decodeAdsCursor(token, ctx)).toEqual({ id: "ad-9", sortValue: 12.34 });
  });

  test("roundtrips a null sort value", () => {
    const ctx = context("roas", "asc");
    const token = encodeAdsCursor("ad-1", null, ctx);
    expect(decodeAdsCursor(token, ctx)).toEqual({ id: "ad-1", sortValue: null });
  });

  test("produces url-safe opaque tokens", () => {
    const token = encodeAdsCursor("ad-9", 1.5, context("spend", "desc"));
    expect(token).not.toMatch(/[+/=]/);
  });

  test("undecodable tokens are 422 CURSOR_INVALID", () => {
    for (const raw of ["not-a-cursor", "e30", Buffer.from("plain text", "utf8").toString("base64url")]) {
      const error = invalid(() => decodeAdsCursor(raw, context("spend", "desc")));
      expect(error.status).toBe(422);
      expect(error.code).toBe("CURSOR_INVALID");
    }
  });

  test("payloads with a wrong shape are 422 CURSOR_INVALID", () => {
    const ctx = context("spend", "desc");
    const bogus = Buffer.from(JSON.stringify({ v: 1, id: "ad-9" }), "utf8").toString("base64url");
    expect(invalid(() => decodeAdsCursor(bogus, ctx)).code).toBe("CURSOR_INVALID");
    const future = Buffer.from(JSON.stringify({ v: 2, id: "ad-9", s: 1, ctx }), "utf8").toString("base64url");
    expect(invalid(() => decodeAdsCursor(future, ctx)).code).toBe("CURSOR_INVALID");
  });

  test("a context change is 422 CURSOR_MISMATCH", () => {
    const token = encodeAdsCursor("ad-9", 12.34, context("spend", "desc"));
    const error = invalid(() => decodeAdsCursor(token, context("roas", "desc")));
    expect(error.status).toBe(422);
    expect(error.code).toBe("CURSOR_MISMATCH");
  });

  test("the context hash is order-sensitive", () => {
    expect(adsCursorContext({ a: 1, b: 2 })).not.toBe(adsCursorContext({ b: 2, a: 1 }));
  });
});
