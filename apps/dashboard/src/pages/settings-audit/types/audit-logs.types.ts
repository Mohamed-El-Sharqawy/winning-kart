export type AuditOutcomeFilter = "" | "success" | "failure";

export interface AuditLogFilters {
  action: string;
  outcome: AuditOutcomeFilter;
  days: number;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorType: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  outcome: string;
  ip: string | null;
  userAgent: string | null;
  occurredAt: Date;
}
