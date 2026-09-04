import { describe, expect, test } from "bun:test";
import { ENTITY_STATUSES, mapEntityStatus } from "./normalize";

describe("mapEntityStatus", () => {
  test("maps the ten live Meta values verbatim", () => {
    const live = [
      "ACTIVE",
      "PAUSED",
      "CAMPAIGN_PAUSED",
      "ADSET_PAUSED",
      "PENDING_REVIEW",
      "DISAPPROVED",
      "PREAPPROVED",
      "PENDING_BILLING_INFO",
      "WITH_ISSUES",
      "IN_PROCESS",
    ] as const;
    for (const value of live) {
      expect(mapEntityStatus(value, undefined)).toBe(value);
    }
  });

  test("maps ADD_REPORTS_RUNNING to ACTIVE", () => {
    expect(mapEntityStatus("ADD_REPORTS_RUNNING", undefined)).toBe("ACTIVE");
  });

  test("maps unknown values to UNKNOWN", () => {
    expect(mapEntityStatus("SOMETHING_NEW", undefined)).toBe("UNKNOWN");
    expect(mapEntityStatus("ARCHIVED", undefined)).toBe("UNKNOWN");
    expect(mapEntityStatus("DELETED", undefined)).toBe("UNKNOWN");
    expect(mapEntityStatus(undefined, undefined)).toBe("UNKNOWN");
  });

  test("falls back to raw status when effective status is absent", () => {
    expect(mapEntityStatus(undefined, "ACTIVE")).toBe("ACTIVE");
    expect(mapEntityStatus(undefined, "WITH_ISSUES")).toBe("WITH_ISSUES");
  });

  test("covers every member of the status enum", () => {
    expect(ENTITY_STATUSES).toHaveLength(11);
    expect(ENTITY_STATUSES).toContain("UNKNOWN");
    expect(ENTITY_STATUSES).not.toContain("ARCHIVED");
    expect(ENTITY_STATUSES).not.toContain("DELETED");
  });
});
