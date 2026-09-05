import type { AdAccount } from "@wk/db";
import type { AdAccountsModel, PlatformEntityState } from "./model";

export type AbsentEntity = PlatformEntityState & { platformId: string };

export interface RemovedEntities {
  campaigns: AbsentEntity[];
  adSets: AbsentEntity[];
  ads: AbsentEntity[];
}

export interface LightListing {
  campaignIds: Set<string>;
  adSetIds: Set<string>;
  adIds: Set<string>;
}

export interface CleanupResult {
  removed: RemovedEntities;
  purgedInsightRows: number;
}

export function collectLightIds<T extends { id: string }>(target: Set<string>, rows: T[]): void {
  for (const row of rows) {
    target.add(row.id);
  }
}

export function absentStates(
  states: Map<string, PlatformEntityState>,
  lightIds: Set<string>
): AbsentEntity[] {
  const removed: AbsentEntity[] = [];
  for (const [platformId, entity] of states) {
    if (!lightIds.has(platformId)) {
      removed.push({ ...entity, platformId });
    }
  }
  return removed;
}

export function insightPurgeIds(removed: RemovedEntities): string[] {
  const ids = new Set<string>();
  for (const entity of [...removed.campaigns, ...removed.adSets, ...removed.ads]) {
    ids.add(entity.id);
  }
  return [...ids];
}

export function pruneEntities(map: Map<string, string>, removed: AbsentEntity[]): void {
  for (const entity of removed) {
    map.delete(entity.platformId);
  }
}

export async function cleanupRemovedEntities(
  model: AdAccountsModel,
  account: AdAccount,
  listing: LightListing
): Promise<CleanupResult> {
  const removed: RemovedEntities = {
    campaigns: absentStates(await model.campaignStates(account.id), listing.campaignIds),
    adSets: absentStates(await model.adSetStates(account.id), listing.adSetIds),
    ads: absentStates(await model.adStates(account.id), listing.adIds),
  };
  const purgedInsightRows = await model.applyAbsenceCleanup(
    account.id,
    removed,
    insightPurgeIds(removed)
  );
  logRemovals(removed, purgedInsightRows);
  return { removed, purgedInsightRows };
}

function logRemovals(removed: RemovedEntities, purgedInsightRows: number): void {
  const removedCount = removed.campaigns.length + removed.adSets.length + removed.ads.length;
  if (removedCount === 0 && purgedInsightRows === 0) {
    return;
  }
  console.warn(
    `absence cleanup: removed ${removed.campaigns.length} campaigns, ${removed.adSets.length} ad sets, ${removed.ads.length} ads, purged ${purgedInsightRows} insight rows`
  );
}
