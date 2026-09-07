import type { BadgeVariant } from "@/shared/components/Badge";
import type { EffectiveStatus, FatigueFlag, StatusFilter } from "../types/creatives.types";

export interface FatigueFlagCopy {
  label: string;
  badgeVariant: BadgeVariant;
  blurb: string;
}

export const FATIGUE_FLAG_COPY: Record<FatigueFlag, FatigueFlagCopy> = {
  fatiguing: {
    label: "Fatiguing",
    badgeVariant: "neutral",
    blurb: "High frequency with declining returns — rotate this creative.",
  },
  bleeding: {
    label: "Bleeding",
    badgeVariant: "down",
    blurb: "Spend without payoff — pause or fix fast.",
  },
  scale: {
    label: "Scale opportunity",
    badgeVariant: "up",
    blurb: "Strong and stable — has room to scale.",
  },
  status_anomaly: {
    label: "Status anomaly",
    badgeVariant: "neutral",
    blurb: "Delivery status looks off — check the platform.",
  },
};

export const FATIGUE_FLAG_ORDER: FatigueFlag[] = ["fatiguing", "bleeding", "scale", "status_anomaly"];

const EFFECTIVE_STATUS_LABELS: Record<EffectiveStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CAMPAIGN_PAUSED: "Campaign paused",
  ADSET_PAUSED: "Ad set paused",
  PENDING_REVIEW: "Pending review",
  DISAPPROVED: "Disapproved",
  PREAPPROVED: "Preapproved",
  PENDING_BILLING_INFO: "Pending billing info",
  WITH_ISSUES: "With issues",
  IN_PROCESS: "In process",
  UNKNOWN: "Unknown",
};

export const EFFECTIVE_STATUS_OPTIONS: { value: Lowercase<EffectiveStatus>; label: string }[] = (
  Object.keys(EFFECTIVE_STATUS_LABELS) as EffectiveStatus[]
).map((status) => ({ value: status.toLowerCase() as Lowercase<EffectiveStatus>, label: EFFECTIVE_STATUS_LABELS[status] }));

export const STATUS_GROUP_LABELS: Record<"all" | "active" | "inactive", string> = {
  all: "All",
  active: "Active",
  inactive: "Inactive",
};

export function statusFilterLabel(value: StatusFilter): string {
  if (value === "all" || value === "active" || value === "inactive") return STATUS_GROUP_LABELS[value];
  const option = EFFECTIVE_STATUS_OPTIONS.find((candidate) => candidate.value === value);
  return option?.label ?? value;
}
