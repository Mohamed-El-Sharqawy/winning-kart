import { isIsoDate } from "@/shared/components/DateRangeControl";

export type WorkspaceTab =
  | "overview"
  | "ad-accounts"
  | "campaigns"
  | "ad-sets"
  | "creatives"
  | "revenue";

export interface ClientWorkspaceSearch {
  tab: WorkspaceTab;
  days?: number;
  from?: string;
  to?: string;
  account?: string;
  accountName?: string;
  campaign?: string;
  campaignName?: string;
  adSet?: string;
  adSetName?: string;
  variant?: string;
  creative?: string;
}

export interface CampaignDetailSearch {
  days: number;
  from?: string;
  to?: string;
  account?: string;
  accountName?: string;
  creative?: string;
}

export type AlertsTab = "alerts" | "tasks" | "recommendations";

export interface AlertsSearch {
  tab: AlertsTab;
}

const MAX_RANGE_DAYS = 365;

export function isAlertsTab(value: unknown): value is AlertsTab {
  return value === "alerts" || value === "tasks" || value === "recommendations";
}

function isWorkspaceTab(value: unknown): value is WorkspaceTab {
  return (
    value === "overview" ||
    value === "ad-accounts" ||
    value === "campaigns" ||
    value === "ad-sets" ||
    value === "creatives" ||
    value === "revenue"
  );
}

export function readTab(value: unknown): WorkspaceTab {
  return isWorkspaceTab(value) ? value : "overview";
}

export function readDays(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return Math.min(Math.floor(parsed), MAX_RANGE_DAYS);
}

export function readOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.min(Math.floor(parsed), MAX_RANGE_DAYS);
}

export function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function readIsoDate(value: unknown): string | undefined {
  return isIsoDate(value) ? value : undefined;
}
