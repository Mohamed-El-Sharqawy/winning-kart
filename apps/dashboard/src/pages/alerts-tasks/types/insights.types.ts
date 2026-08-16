import type { AlertSeverity } from "./alerts.types";

export type AttributionStatus = "attributed" | "unattributed";

export interface InsightContributor {
  name: string;
  pct: number;
}

export interface Insight {
  id: string;
  insightType: string;
  severity: AlertSeverity;
  headline: string;
  entityName: string;
  primaryCause: string | null;
  attributionStatus: AttributionStatus;
  decomposition: InsightContributor[];
  recommendedAction: string;
  ctaTarget: string | null;
  acceptedAsTaskId: string | null;
  notUsefulCount: number;
  priorityScore: number;
  detectedAt: Date;
  clientName: string;
}
