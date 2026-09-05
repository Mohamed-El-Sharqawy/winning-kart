import { ENTITY_STATUSES } from "@wk/db/schema";
import { problem } from "../../lib/problem";

export const ACTIVE_STATUSES: readonly string[] = ["ACTIVE"];
export const INACTIVE_STATUSES: readonly string[] = ENTITY_STATUSES.filter(
  (status) => status !== "ACTIVE"
);

export const STATUS_GROUPS: Record<string, readonly string[]> = {
  active: ACTIVE_STATUSES,
  inactive: INACTIVE_STATUSES,
  all: ENTITY_STATUSES,
};

const EXACT_STATUS_BY_LOWER = new Map(ENTITY_STATUSES.map((status) => [status.toLowerCase(), status]));

export const ADS_FLAGS = ["bleeding", "fatiguing", "status_anomaly", "scale"] as const;
export const ADS_FORMATS = ["IMAGE", "VIDEO", "CAROUSEL"] as const;
export const ADS_SORTS = ["spend", "roas", "ctr", "frequency"] as const;
export const ADS_ORDERS = ["asc", "desc"] as const;

export type AdsFlag = (typeof ADS_FLAGS)[number];
export type AdsFormat = (typeof ADS_FORMATS)[number];
export type AdsSort = (typeof ADS_SORTS)[number];
export type AdsOrder = (typeof ADS_ORDERS)[number];

export interface AdsFilters {
  statuses: readonly string[];
  adSetId: string | null;
  campaignId: string | null;
  flag: AdsFlag | null;
  format: AdsFormat | null;
  q: string | null;
}

export const ADS_LIMIT_DEFAULT = 50;
export const ADS_LIMIT_MAX = 100;

function validation(detail: string): never {
  throw problem(422, "VALIDATION", detail);
}

function normalize(raw: string | undefined): string | null {
  const value = raw?.trim().toLowerCase();
  return value === undefined || value === "" ? null : value;
}

export function parseAdsStatus(raw: string | undefined): readonly string[] {
  const value = normalize(raw);
  if (value === null) {
    return STATUS_GROUPS.active;
  }
  const group = STATUS_GROUPS[value];
  if (group !== undefined) {
    return group;
  }
  const exact = EXACT_STATUS_BY_LOWER.get(value);
  if (exact !== undefined) {
    return [exact];
  }
  validation(`Unknown status filter '${raw}'`);
}

export function parseAdsFlag(raw: string | undefined): AdsFlag | null {
  const value = normalize(raw);
  if (value === null) {
    return null;
  }
  if ((ADS_FLAGS as readonly string[]).includes(value)) {
    return value as AdsFlag;
  }
  validation(`Unknown flag filter '${raw}'`);
}

export function parseAdsFormat(raw: string | undefined): AdsFormat | null {
  const value = normalize(raw);
  if (value === null) {
    return null;
  }
  const format = ADS_FORMATS.find((candidate) => candidate.toLowerCase() === value);
  if (format !== undefined) {
    return format;
  }
  validation(`Unknown format filter '${raw}'`);
}

export function parseAdsSort(raw: string | undefined): AdsSort {
  const value = normalize(raw);
  if (value === null) {
    return "spend";
  }
  if ((ADS_SORTS as readonly string[]).includes(value)) {
    return value as AdsSort;
  }
  validation(`Unknown sort '${raw}'`);
}

export function parseAdsOrder(raw: string | undefined): AdsOrder {
  const value = normalize(raw);
  if (value === null) {
    return "desc";
  }
  if ((ADS_ORDERS as readonly string[]).includes(value)) {
    return value as AdsOrder;
  }
  validation(`Unknown order '${raw}'`);
}

export function parseAdsLimit(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return ADS_LIMIT_DEFAULT;
  }
  if (!/^\d+$/.test(raw.trim())) {
    validation(`limit must be an integer between 1 and ${ADS_LIMIT_MAX}`);
  }
  const value = Number.parseInt(raw, 10);
  if (value < 1 || value > ADS_LIMIT_MAX) {
    validation(`limit must be between 1 and ${ADS_LIMIT_MAX}`);
  }
  return value;
}

export function parseAdsFilters(input: {
  status?: string;
  adSetId?: string;
  campaignId?: string;
  flag?: string;
  format?: string;
  q?: string;
}): AdsFilters {
  const q = input.q?.trim();
  return {
    statuses: parseAdsStatus(input.status),
    adSetId: input.adSetId?.trim() || null,
    campaignId: input.campaignId?.trim() || null,
    flag: parseAdsFlag(input.flag),
    format: parseAdsFormat(input.format),
    q: q === "" ? null : (q ?? null),
  };
}
