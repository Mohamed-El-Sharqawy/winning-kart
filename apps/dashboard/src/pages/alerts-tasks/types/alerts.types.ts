export type AlertSeverity = "critical" | "warning" | "info";

export type AlertStatus = "open" | "snoozed" | "acknowledged" | "suppressed" | "dismissed";

export type AlertListStatus = "open" | "all" | "snoozed" | "acknowledged" | "suppressed" | "dismissed";

export interface Alert {
  id: string;
  clientId: string;
  adAccountId: string;
  triggerType: string;
  severity: AlertSeverity;
  entityLevel: string;
  entityId: string;
  entityName: string;
  whatHappened: string;
  whyItMatters: string;
  supportingMetrics: Record<string, number | string>;
  recommendedAction: string;
  ctaTarget: string | null;
  status: AlertStatus;
  snoozedUntil: Date | null;
  dismissedReason: string | null;
  suppressedByTaskId: string | null;
  priorityScore: number;
  detectedAt: Date;
  lastSeenAt: Date;
  clientName: string;
}
