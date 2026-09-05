import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { problem } from "../../lib/problem";

const CURSOR_VERSION = 1;

export interface AdsCursor {
  id: string;
  sortValue: number | null;
}

interface AdsCursorPayload {
  v: number;
  id: string;
  s: number | null;
  ctx: string;
}

export function adsCursorContext(parts: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);
}

export function encodeAdsCursor(id: string, sortValue: number | null, ctx: string): string {
  const payload: AdsCursorPayload = { v: CURSOR_VERSION, id, s: sortValue, ctx };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function isPayload(value: unknown): value is AdsCursorPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const payload = value as Partial<AdsCursorPayload>;
  return (
    payload.v === CURSOR_VERSION &&
    typeof payload.id === "string" &&
    payload.id.length > 0 &&
    typeof payload.ctx === "string" &&
    (payload.s === null || (typeof payload.s === "number" && Number.isFinite(payload.s)))
  );
}

function cursorInvalid(detail: string): never {
  throw problem(422, "CURSOR_INVALID", detail);
}

export function decodeAdsCursor(raw: string, ctx: string): AdsCursor {
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    cursorInvalid("cursor is not decodable");
  }
  if (!isPayload(payload)) {
    cursorInvalid("cursor payload has an unknown shape");
  }
  if (payload.ctx !== ctx) {
    throw problem(
      422,
      "CURSOR_MISMATCH",
      "cursor does not match the current filters, window, sort, and order"
    );
  }
  return { id: payload.id, sortValue: payload.s };
}
