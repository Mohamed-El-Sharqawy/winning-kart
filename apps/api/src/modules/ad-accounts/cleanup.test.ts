import { describe, expect, test } from "bun:test";
import { absentStates, insightPurgeIds } from "./cleanup";
import type { AbsentEntity, RemovedEntities } from "./cleanup";
import type { PlatformEntityState } from "./model";

function state(id: string, platformId?: string): AbsentEntity {
  return {
    id,
    platformId: platformId ?? id,
    platformUpdatedAt: new Date("2026-09-01T10:00:00Z"),
  };
}

function statesMap(entries: [string, string][]): Map<string, PlatformEntityState> {
  return new Map(entries.map(([platformId, id]) => [platformId, state(id)]));
}

function union(...pages: string[][]): Set<string> {
  return new Set(pages.flat());
}

describe("absentStates", () => {
  test("removes rows whose platform id is absent from the light listing", () => {
    const states = statesMap([
      ["c-kept", "db-1"],
      ["c-gone", "db-2"],
    ]);
    const removed = absentStates(states, union(["c-kept"]));
    expect(removed.map((row) => row.id)).toEqual(["db-2"]);
  });

  test("computes absence over the union of all pages, never per page", () => {
    const states = statesMap([
      ["c-page1", "db-1"],
      ["c-page2", "db-2"],
    ]);
    const removed = absentStates(states, union(["c-page1"], ["c-page2"]));
    expect(removed).toEqual([]);
  });

  test("keeps rows present in the listing regardless of status", () => {
    const states = statesMap([["c-unknown", "db-1"]]);
    expect(absentStates(states, union(["c-unknown"]))).toEqual([]);
  });

  test("removes every stored row when the listing is empty", () => {
    const states = statesMap([
      ["c-1", "db-1"],
      ["c-2", "db-2"],
    ]);
    const removed = absentStates(states, new Set());
    expect(removed.map((row) => row.id)).toEqual(["db-1", "db-2"]);
  });

  test("removes nothing when nothing is stored", () => {
    expect(absentStates(new Map(), union(["c-1"]))).toEqual([]);
  });
});

describe("insightPurgeIds", () => {
  test("unions entity ids across all three levels", () => {
    const removed: RemovedEntities = {
      campaigns: [state("camp-1", "c-1")],
      adSets: [state("adset-1", "s-1")],
      ads: [state("ad-1", "a-1")],
    };
    expect(insightPurgeIds(removed).sort()).toEqual(["ad-1", "adset-1", "camp-1"]);
  });

  test("deduplicates ids shared by cascade levels", () => {
    const removed: RemovedEntities = {
      campaigns: [state("dup", "c-1")],
      adSets: [state("dup", "s-1")],
      ads: [],
    };
    expect(insightPurgeIds(removed)).toEqual(["dup"]);
  });

  test("returns empty for no removals", () => {
    expect(insightPurgeIds({ campaigns: [], adSets: [], ads: [] })).toEqual([]);
  });
});
