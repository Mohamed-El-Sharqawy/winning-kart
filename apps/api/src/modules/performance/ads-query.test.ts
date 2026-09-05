import { describe, expect, test } from "bun:test";
import { ProblemError } from "../../lib/problem";
import {
  ADS_LIMIT_DEFAULT,
  ADS_LIMIT_MAX,
  parseAdsFlag,
  parseAdsFormat,
  parseAdsLimit,
  parseAdsOrder,
  parseAdsSort,
  parseAdsStatus,
} from "./ads-query";

function validationError(run: () => unknown): ProblemError {
  try {
    run();
  } catch (error) {
    return error as ProblemError;
  }
  throw new Error("expected a ProblemError");
}

describe("parseAdsStatus", () => {
  test("defaults to the active group", () => {
    expect(parseAdsStatus(undefined)).toEqual(["ACTIVE"]);
    expect(parseAdsStatus("")).toEqual(["ACTIVE"]);
  });

  test("group names resolve per ADR 0002", () => {
    expect(parseAdsStatus("active")).toEqual(["ACTIVE"]);
    const inactive = parseAdsStatus("inactive");
    expect(inactive).not.toContain("ACTIVE");
    expect(inactive).toContain("PAUSED");
    expect(inactive).toContain("PENDING_REVIEW");
    expect(inactive).toContain("UNKNOWN");
    expect(inactive).toHaveLength(10);
    expect(parseAdsStatus("all")).toHaveLength(11);
  });

  test("exact values resolve in lowercase snake_case", () => {
    expect(parseAdsStatus("pending_review")).toEqual(["PENDING_REVIEW"]);
    expect(parseAdsStatus("campaign_paused")).toEqual(["CAMPAIGN_PAUSED"]);
    expect(parseAdsStatus("with_issues")).toEqual(["WITH_ISSUES"]);
  });

  test("unknown values are 422 VALIDATION", () => {
    const error = validationError(() => parseAdsStatus("archived"));
    expect(error).toBeInstanceOf(ProblemError);
    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION");
  });
});

describe("parseAdsFlag", () => {
  test("returns null when absent", () => {
    expect(parseAdsFlag(undefined)).toBeNull();
    expect(parseAdsFlag("")).toBeNull();
  });

  test("accepts the four flags", () => {
    expect(parseAdsFlag("bleeding")).toBe("bleeding");
    expect(parseAdsFlag("fatiguing")).toBe("fatiguing");
    expect(parseAdsFlag("status_anomaly")).toBe("status_anomaly");
    expect(parseAdsFlag("scale")).toBe("scale");
  });

  test("unknown flags are 422 VALIDATION", () => {
    expect(validationError(() => parseAdsFlag("winning")).code).toBe("VALIDATION");
  });
});

describe("parseAdsFormat", () => {
  test("returns null when absent", () => {
    expect(parseAdsFormat(undefined)).toBeNull();
  });

  test("accepts the three formats case-insensitively", () => {
    expect(parseAdsFormat("IMAGE")).toBe("IMAGE");
    expect(parseAdsFormat("video")).toBe("VIDEO");
    expect(parseAdsFormat("Carousel")).toBe("CAROUSEL");
  });

  test("unknown formats are 422 VALIDATION", () => {
    expect(validationError(() => parseAdsFormat("GIF")).code).toBe("VALIDATION");
  });
});

describe("parseAdsSort", () => {
  test("defaults to spend", () => {
    expect(parseAdsSort(undefined)).toBe("spend");
  });

  test("accepts the four metric sorts case-insensitively", () => {
    expect(parseAdsSort("roas")).toBe("roas");
    expect(parseAdsSort("CTR")).toBe("ctr");
    expect(parseAdsSort("Frequency")).toBe("frequency");
  });

  test("unknown sorts are 422 VALIDATION", () => {
    expect(validationError(() => parseAdsSort("cpa")).code).toBe("VALIDATION");
  });
});

describe("parseAdsOrder", () => {
  test("defaults to desc", () => {
    expect(parseAdsOrder(undefined)).toBe("desc");
  });

  test("accepts asc and desc case-insensitively", () => {
    expect(parseAdsOrder("asc")).toBe("asc");
    expect(parseAdsOrder("DESC")).toBe("desc");
  });

  test("unknown orders are 422 VALIDATION", () => {
    expect(validationError(() => parseAdsOrder("up")).code).toBe("VALIDATION");
  });
});

describe("parseAdsLimit", () => {
  test("defaults to 50 and caps at 100", () => {
    expect(ADS_LIMIT_DEFAULT).toBe(50);
    expect(ADS_LIMIT_MAX).toBe(100);
    expect(parseAdsLimit(undefined)).toBe(50);
  });

  test("accepts in-range values", () => {
    expect(parseAdsLimit("1")).toBe(1);
    expect(parseAdsLimit("100")).toBe(100);
  });

  test("out-of-range and non-numeric values are 422 VALIDATION", () => {
    expect(validationError(() => parseAdsLimit("0")).code).toBe("VALIDATION");
    expect(validationError(() => parseAdsLimit("101")).code).toBe("VALIDATION");
    expect(validationError(() => parseAdsLimit("-5")).code).toBe("VALIDATION");
    expect(validationError(() => parseAdsLimit("abc")).code).toBe("VALIDATION");
  });
});
