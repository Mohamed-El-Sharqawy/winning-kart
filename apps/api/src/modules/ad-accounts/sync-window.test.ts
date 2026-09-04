import { describe, expect, test } from "bun:test";
import { resolveInsightWindow } from "./sync-window";

const BASE = { windowDays: 30, deltaDays: 3 };

describe("resolveInsightWindow", () => {
  test("first sync with no watermark pulls the full window", () => {
    expect(resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: null })).toEqual({
      since: "2026-08-06",
      until: "2026-09-04",
    });
  });

  test("watermark from today collapses to the delta window", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-09-04" })
    ).toEqual({ since: "2026-09-02", until: "2026-09-04" });
  });

  test("watermark from yesterday stays on the delta window", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-09-03" })
    ).toEqual({ since: "2026-09-02", until: "2026-09-04" });
  });

  test("watermark older than the delta window catches up from the watermark", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-08-29" })
    ).toEqual({ since: "2026-08-29", until: "2026-09-04" });
  });

  test("watermark one day before the delta start re-pulls from the watermark", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-09-01" })
    ).toEqual({ since: "2026-09-01", until: "2026-09-04" });
  });

  test("ancient watermark is clamped to the window start", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-01-01" })
    ).toEqual({ since: "2026-08-06", until: "2026-09-04" });
  });

  test("future watermark stays on the delta window", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-09-10" })
    ).toEqual({ since: "2026-09-02", until: "2026-09-04" });
  });

  test("watermark on the delta start re-pulls exactly the delta window", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-04", syncedThrough: "2026-09-02" })
    ).toEqual({ since: "2026-09-02", until: "2026-09-04" });
  });

  test("one-day window with no watermark pulls only today", () => {
    expect(
      resolveInsightWindow({
        windowDays: 1,
        deltaDays: 1,
        today: "2026-09-04",
        syncedThrough: null,
      })
    ).toEqual({ since: "2026-09-04", until: "2026-09-04" });
  });

  test("one-day window clamps an old watermark to today", () => {
    expect(
      resolveInsightWindow({
        windowDays: 1,
        deltaDays: 1,
        today: "2026-09-04",
        syncedThrough: "2026-08-01",
      })
    ).toEqual({ since: "2026-09-04", until: "2026-09-04" });
  });

  test("crosses month boundaries correctly", () => {
    expect(
      resolveInsightWindow({ ...BASE, today: "2026-09-01", syncedThrough: "2026-08-30" })
    ).toEqual({ since: "2026-08-30", until: "2026-09-01" });
  });
});
