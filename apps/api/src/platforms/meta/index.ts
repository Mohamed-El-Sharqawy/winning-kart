import { MetaClient } from "./client";
import type {
  InsightLevel,
  MetaAccountInfo,
  MetaAdLightRow,
  MetaAdRow,
  MetaAdSetLightRow,
  MetaAdSetRow,
  MetaCampaignLightRow,
  MetaCampaignRow,
  MetaInsightRow,
  MetaVideoMedia,
  TimeRange,
} from "./client";
import type { RateGuard, RateSnapshot } from "./rate-limit";

export { MetaClient, MetaError } from "./client";
export {
  AD_FIELDS,
  AD_SET_FIELDS,
  CAMPAIGN_FIELDS,
  MEDIA_IDS_BATCH_MAX,
  RESOLVE_AD_FIELDS,
  VIDEO_MEDIA_FIELDS,
} from "./client";
export { RateGuard } from "./rate-limit";
export type { RateSnapshot, RateUsage } from "./rate-limit";
export type {
  InsightLevel,
  MetaAccountInfo,
  MetaActionMetric,
  MetaAdCreativeRef,
  MetaAdLightRow,
  MetaAdRow,
  MetaAdSetLightRow,
  MetaAdSetRow,
  MetaCampaignLightRow,
  MetaCampaignRow,
  MetaErrorClass,
  MetaInsightRow,
  MetaVideoMedia,
  TimeRange,
} from "./client";
export {
  aggregateInsightsByDate,
  ENTITY_STATUSES,
  mapEntityStatus,
  normalizeAccountInfo,
  normalizeAd,
  normalizeAdSet,
  normalizeCampaign,
  normalizeInsight,
  parsePlatformTime,
  round2,
} from "./normalize";
export type {
  AccountInfoSnapshot,
  AdFormat,
  AdRecord,
  AdSetRecord,
  CampaignRecord,
  EntityStatus,
  InsightRecord,
} from "./normalize";

export interface AdPlatformAdapter {
  readonly rateGuard: RateGuard;
  graphCallCount(): number;
  getAccountInfo(actId: string): Promise<MetaAccountInfo>;
  getCampaigns(actId: string): Promise<MetaCampaignRow[]>;
  getCampaignIds(actId: string): Promise<MetaCampaignLightRow[]>;
  getAdSets(actId: string): Promise<MetaAdSetRow[]>;
  getAdSetIds(actId: string): Promise<MetaAdSetLightRow[]>;
  getAds(actId: string): Promise<MetaAdRow[]>;
  getAdIds(actId: string): Promise<MetaAdLightRow[]>;
  getAdsByIds(ids: string[]): Promise<MetaAdRow[]>;
  getVideoMedia(videoId: string): Promise<MetaVideoMedia | null>;
  getEntityById<T>(id: string, fields: string): Promise<T | null>;
  getInsights(actId: string, level: InsightLevel, timeRange: TimeRange): Promise<MetaInsightRow[]>;
}

export function getMetaAdapter(token: string): AdPlatformAdapter {
  return new MetaClient(token);
}
