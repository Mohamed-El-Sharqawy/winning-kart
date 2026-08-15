import { MetaClient } from "./client";
import type {
  InsightLevel,
  MetaAccountInfo,
  MetaAdRow,
  MetaAdSetRow,
  MetaCampaignRow,
  MetaInsightRow,
  TimeRange,
} from "./client";

export { MetaClient, MetaError } from "./client";
export type {
  InsightLevel,
  MetaAccountInfo,
  MetaActionMetric,
  MetaAdRow,
  MetaAdSetRow,
  MetaCampaignRow,
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
  normalizeInsight,
  round2,
} from "./normalize";
export type {
  AccountInfoSnapshot,
  AdRecord,
  AdSetRecord,
  CampaignRecord,
  EntityStatus,
  InsightRecord,
} from "./normalize";

export interface AdPlatformAdapter {
  getAccountInfo(actId: string): Promise<MetaAccountInfo>;
  getCampaigns(actId: string): Promise<MetaCampaignRow[]>;
  getAdSets(actId: string): Promise<MetaAdSetRow[]>;
  getAds(actId: string): Promise<MetaAdRow[]>;
  getInsights(actId: string, level: InsightLevel, timeRange: TimeRange): Promise<MetaInsightRow[]>;
}

export function getMetaAdapter(token: string): AdPlatformAdapter {
  return new MetaClient(token);
}
