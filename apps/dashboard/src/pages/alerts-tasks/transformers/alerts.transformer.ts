import type { AlertDto } from "../dto/alerts.dto";
import type { Alert } from "../types/alerts.types";

export function toAlert(dto: AlertDto): Alert {
  return {
    ...dto,
    supportingMetrics: dto.supportingMetrics ?? {},
    ctaTarget: dto.ctaTarget ?? null,
    snoozedUntil: dto.snoozedUntil ? new Date(dto.snoozedUntil) : null,
    dismissedReason: dto.dismissedReason ?? null,
    suppressedByTaskId: dto.suppressedByTaskId ?? null,
    detectedAt: new Date(dto.detectedAt),
    lastSeenAt: new Date(dto.lastSeenAt),
  };
}

export function toAlerts(dtos: AlertDto[]): Alert[] {
  return dtos.map(toAlert);
}
