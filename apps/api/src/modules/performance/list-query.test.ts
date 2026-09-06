import { describe, expect, test } from "bun:test";
import { ProblemError } from "../../lib/problem";
import {
  LIST_PAGE_SIZE_DEFAULT,
  LIST_PAGE_SIZE_MAX,
  parseListFilters,
  parseListPage,
} from "./list-query";

function validationError(run: () => unknown): ProblemError {
  try {
    run();
  } catch (error) {
    return error as ProblemError;
  }
  throw new Error("expected a ProblemError");
}

describe("parseListPage", () => {
  test("defaults to page 1 and pageSize 25", () => {
    expect(LIST_PAGE_SIZE_DEFAULT).toBe(25);
    expect(LIST_PAGE_SIZE_MAX).toBe(100);
    expect(parseListPage({})).toEqual({ page: 1, pageSize: 25 });
    expect(parseListPage({ page: "", pageSize: "" })).toEqual({ page: 1, pageSize: 25 });
  });

  test("accepts in-range values", () => {
    expect(parseListPage({ page: "2", pageSize: "50" })).toEqual({ page: 2, pageSize: 50 });
    expect(parseListPage({ page: "999999", pageSize: "100" })).toEqual({
      page: 999999,
      pageSize: 100,
    });
  });

  test("out-of-range and non-numeric pageSize values are 422 VALIDATION", () => {
    expect(validationError(() => parseListPage({ pageSize: "0" })).code).toBe("VALIDATION");
    expect(validationError(() => parseListPage({ pageSize: "101" })).code).toBe("VALIDATION");
    expect(validationError(() => parseListPage({ pageSize: "2.5" })).code).toBe("VALIDATION");
    expect(validationError(() => parseListPage({ pageSize: "abc" })).code).toBe("VALIDATION");
  });

  test("page must be a positive integer", () => {
    expect(validationError(() => parseListPage({ page: "0" })).code).toBe("VALIDATION");
    expect(validationError(() => parseListPage({ page: "-3" })).code).toBe("VALIDATION");
    expect(validationError(() => parseListPage({ page: "one" })).code).toBe("VALIDATION");
  });

  test("absurd page values are 422 VALIDATION", () => {
    expect(validationError(() => parseListPage({ page: "99999999999999999999" })).code).toBe(
      "VALIDATION"
    );
    expect(validationError(() => parseListPage({ page: "1000001" })).code).toBe("VALIDATION");
  });
});

describe("parseListFilters", () => {
  test("defaults to the active status group with no q or campaignId", () => {
    const filters = parseListFilters({});
    expect(filters.statuses).toEqual(["ACTIVE"]);
    expect(filters.q).toBeNull();
    expect(filters.campaignId).toBeNull();
  });

  test("resolves status groups and exact values per ADR 0002", () => {
    expect(parseListFilters({ status: "inactive" }).statuses).not.toContain("ACTIVE");
    expect(parseListFilters({ status: "pending_review" }).statuses).toEqual(["PENDING_REVIEW"]);
    expect(parseListFilters({ status: "all" }).statuses).toHaveLength(11);
  });

  test("unknown status values are 422 VALIDATION", () => {
    expect(validationError(() => parseListFilters({ status: "archived" })).code).toBe("VALIDATION");
  });

  test("trims q and passes campaignId through", () => {
    expect(parseListFilters({ q: "  eid  " }).q).toBe("eid");
    expect(parseListFilters({ q: "   " }).q).toBeNull();
    expect(parseListFilters({ campaignId: "cmp-9" }).campaignId).toBe("cmp-9");
  });
});
