export type AlertSeverityDto = "critical" | "warning" | "info";

export type AlertStatusDto = "open" | "snoozed" | "acknowledged" | "suppressed" | "dismissed";

export interface AlertDto {
  id: string;
  clientId: string;
  adAccountId: string;
  triggerType: string;
  severity: AlertSeverityDto;
  entityLevel: string;
  entityId: string;
  entityName: string;
  whatHappened: string;
  whyItMatters: string;
  supportingMetrics: Record<string, number | string> | null;
  recommendedAction: string;
  ctaTarget: string | null;
  status: AlertStatusDto;
  snoozedUntil: string | null;
  dismissedReason: string | null;
  suppressedByTaskId: string | null;
  priorityScore: number;
  detectedAt: string;
  lastSeenAt: string;
  clientName: string;
}

export interface OkDto {
  ok: boolean;
}
