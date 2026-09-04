import { svgThumb, videoSource } from "./mock-media";

export type ProtoStatus =
  | "ACTIVE"
  | "PAUSED"
  | "IN_REVIEW"
  | "DISAPPROVED"
  | "DRAFT"
  | "SCHEDULED"
  | "ADSET_PAUSED"
  | "CAMPAIGN_PAUSED";

export type ProtoFormat = "IMAGE" | "VIDEO" | "CAROUSEL";
export type ProtoSortKey = "spend" | "roas" | "ctr" | "frequency";
export type ProtoStatusFilter = "all" | "active" | "inactive" | ProtoStatus;
export type ProtoFatigue = "fatiguing" | "bleeding" | "scale";

export interface ProtoCreative {
  id: string;
  name: string;
  campaignName: string;
  adSetName: string;
  status: ProtoStatus;
  format: ProtoFormat;
  cards: number;
  thumb: string;
  videoUrl: string | null;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  cpa: number;
  frequency: number;
  purchases: number;
  spendShare: number;
  fatigue: { flag: ProtoFatigue; reason: string } | null;
}

export const STATUS_META: Record<ProtoStatus, { label: string; dot: "up" | "neutral" | "warning" | "down" }> = {
  ACTIVE: { label: "Active", dot: "up" },
  PAUSED: { label: "Paused", dot: "neutral" },
  IN_REVIEW: { label: "In review", dot: "warning" },
  DISAPPROVED: { label: "Disapproved", dot: "down" },
  DRAFT: { label: "Draft", dot: "neutral" },
  SCHEDULED: { label: "Scheduled", dot: "warning" },
  ADSET_PAUSED: { label: "Ad set paused", dot: "neutral" },
  CAMPAIGN_PAUSED: { label: "Campaign paused", dot: "neutral" },
};

export const STATUS_KEYS = Object.keys(STATUS_META) as ProtoStatus[];
export const STATUS_LABELS: Record<ProtoStatusFilter, string> = {
  all: "All",
  active: "Active (running)",
  inactive: "Inactive",
  ACTIVE: "Active",
  PAUSED: "Paused",
  IN_REVIEW: "In review",
  DISAPPROVED: "Disapproved",
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  ADSET_PAUSED: "Ad set paused",
  CAMPAIGN_PAUSED: "Campaign paused",
};

const INACTIVE: ProtoStatus[] = ["PAUSED", "ADSET_PAUSED", "CAMPAIGN_PAUSED", "DISAPPROVED"];
const HOOKS = ["Bouquet reveal", "UGC unboxing", "Founder story", "Rose close-up", "Wedding bundle", "Same-day delivery", "Tulip field walk", "Care tips", "Vday promo", "Mothers day teaser"];
const CAMPAIGNS = ["Dia - Advantage+ Shopping", "Dia - Prospecting Broad", "Dia - Retargeting 30d", "Dia - Brand awareness"];
const AD_SETS = ["Broad 25-55", "Lookalike 1%", "New UGC", "Carousel test", "Retarget purchasers", "Interest gifting"];
const FATIGUE_REASONS: Record<ProtoFatigue, string> = {
  fatiguing: "Frequency 4.2 over 14 days",
  bleeding: "ROAS down 38% week over week",
  scale: "Spend up 3x at stable ROAS",
};

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260904);

function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

function statusRoll(): ProtoStatus {
  const roll = rand();
  if (roll < 0.55) return "ACTIVE";
  if (roll < 0.67) return "PAUSED";
  if (roll < 0.75) return "ADSET_PAUSED";
  if (roll < 0.81) return "CAMPAIGN_PAUSED";
  if (roll < 0.87) return "IN_REVIEW";
  if (roll < 0.92) return "DISAPPROVED";
  if (roll < 0.96) return "DRAFT";
  return "SCHEDULED";
}

function formatRoll(): ProtoFormat {
  const roll = rand();
  if (roll < 0.4) return "IMAGE";
  if (roll < 0.8) return "VIDEO";
  return "CAROUSEL";
}

const POOL: ProtoCreative[] = Array.from({ length: 180 }, (_, index) => {
  const id = String(1203000000000 + index * 877 + Math.floor(rand() * 500));
  const format = formatRoll();
  const spend = Math.round((30 + Math.pow(rand(), 2) * 9000) * 100) / 100;
  const roas = Math.round((0.2 + Math.pow(rand(), 1.4) * 5.3) * 100) / 100;
  const purchases = Math.max(0, Math.round((spend / 45) * (roas / 2) * (0.6 + rand() * 0.8)));
  const fatigueRoll = rand();
  const fatigue =
    spend > 4000 && fatigueRoll < 0.25
      ? { flag: "fatiguing" as ProtoFatigue, reason: FATIGUE_REASONS.fatiguing }
      : roas < 0.8 && fatigueRoll > 0.8
        ? { flag: "bleeding" as ProtoFatigue, reason: FATIGUE_REASONS.bleeding }
        : spend > 7000 && fatigueRoll > 0.6 && fatigueRoll < 0.7
          ? { flag: "scale" as ProtoFatigue, reason: FATIGUE_REASONS.scale }
          : null;
  return {
    id,
    name: `${pick(HOOKS)} v${1 + Math.floor(rand() * 9)}`,
    campaignName: pick(CAMPAIGNS),
    adSetName: pick(AD_SETS),
    status: statusRoll(),
    format,
    cards: format === "CAROUSEL" ? 2 + Math.floor(rand() * 4) : 1,
    thumb: svgThumb(id, 400, 500),
    videoUrl: format === "VIDEO" ? videoSource(id) : null,
    spend,
    revenue: Math.round(spend * roas * 100) / 100,
    roas,
    ctr: Math.round((0.4 + rand() * 3.6) * 100) / 100,
    cpa: purchases > 0 ? Math.round((spend / purchases) * 100) / 100 : 0,
    frequency: Math.round((0.8 + rand() * 5.2) * 100) / 100,
    purchases,
    spendShare: Math.round(rand() * 120) / 1000,
    fatigue,
  };
});

export const POOL_SIZE = POOL.length;

export function filterCreatives(filter: {
  status: ProtoStatusFilter;
  format: "all" | ProtoFormat;
  sort: ProtoSortKey;
}): ProtoCreative[] {
  const matched = POOL.filter((creative) => {
    if (filter.status === "active" && creative.status !== "ACTIVE") return false;
    if (filter.status === "inactive" && !INACTIVE.includes(creative.status)) return false;
    if (typeof filter.status === "string" && !["all", "active", "inactive"].includes(filter.status)) {
      if (creative.status !== filter.status) return false;
    }
    if (filter.format !== "all" && creative.format !== filter.format) return false;
    return true;
  });
  return matched.sort((a, b) => b[filter.sort] - a[filter.sort]);
}

export function adsManagerUrl(creative: ProtoCreative): string {
  return `https://www.facebook.com/adsmanager/manage/campaigns?act=act_1029384756&selected_ad_ids=${creative.id}`;
}
