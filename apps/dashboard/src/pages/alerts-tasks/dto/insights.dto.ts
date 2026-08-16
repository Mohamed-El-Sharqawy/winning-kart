import type { AlertSeverityDto } from "./alerts.dto";

export type AttributionStatusDto = "attributed" | "unattributed";

export interface InsightDto {
  id: string;
  insightType: string;
  severity: AlertSeverityDto;
  headline: string;
  entityName: string;
  primaryCause: string | null;
  attributionStatus: AttributionStatusDto;
  decomposition: Record<string, number> | null;
  recommendedAction: string;
  ctaTarget: string | null;
  acceptedAsTaskId: string | null;
  notUsefulCount: number;
  priorityScore: number;
  detectedAt: string;
  clientName: string;
}
