import { MetaClient } from "./client";
import type {
  CreativeDetailMap,
  InsightLevel,
  MetaAccountInfo,
  MetaAdRow,
  MetaAdSetRow,
  MetaCampaignRow,
  MetaInsightRow,
  TimeRange,
} from "./client";
import type { RateGuard, RateSnapshot } from "./rate-limit";

export { MetaClient, MetaError } from "./client";
export { RateGuard } from "./rate-limit";
export type { RateSnapshot, RateUsage } from "./rate-limit";
export type {
  CreativeDetailMap,
  InsightLevel,
  MetaAccountInfo,
  MetaActionMetric,
  MetaAdCreativeRef,
  MetaAdRow,
  MetaAdSetRow,
  MetaCampaignRow,
  MetaCreativeDetailRow,
  MetaErrorClass,
  MetaInsightRow,
  TimeRange,
} from "./client";
export {
  aggregateInsightsByDate,
  mapEntityStatus,
  normalizeAccountInfo,
  normalizeAd,
  normalizeAdSet,
  normalizeCampaign,
  normalizeCreativeDetail,
  normalizeInsight,
  round2,
} from "./normalize";
export type {
  AccountInfoSnapshot,
  AdRecord,
  AdSetRecord,
  CampaignRecord,
  CreativeDetailRecord,
  EntityStatus,
  InsightRecord,
} from "./normalize";

export interface AdPlatformAdapter {
  readonly rateGuard: RateGuard;
  getAccountInfo(actId: string): Promise<MetaAccountInfo>;
  getCampaigns(actId: string): Promise<MetaCampaignRow[]>;
  getAdSets(actId: string): Promise<MetaAdSetRow[]>;
  getAds(actId: string): Promise<MetaAdRow[]>;
  getCreativeDetails(actId: string): Promise<CreativeDetailMap>;
  getInsights(actId: string, level: InsightLevel, timeRange: TimeRange): Promise<MetaInsightRow[]>;
}

export function getMetaAdapter(token: string): AdPlatformAdapter {
  return new MetaClient(token);
}
