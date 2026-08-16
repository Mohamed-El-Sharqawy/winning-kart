import type { BadgeVariant } from "@/shared/components/Badge";
import type { FatigueFlag } from "../types/creatives.types";

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
