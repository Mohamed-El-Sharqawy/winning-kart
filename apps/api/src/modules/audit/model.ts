import { and, desc, eq, gte } from "drizzle-orm";
import { auditLogs, db } from "@wk/db";

export interface AuditLogRow {
  id: string;
  actorUserId: string | null;
  actorType: string;
  action: string;
  targetEntityType: string | null;
  targetEntityId: string | null;
  outcome: string;
  ip: string | null;
  userAgent: string | null;
  occurredAt: Date;
}

export interface AuditLogFilters {
  action?: string;
  actorUserId?: string;
  outcome?: string;
  since: Date;
}

const AUDIT_LIST_LIMIT = 200;

export class AuditModel {
  list(filters: AuditLogFilters): Promise<AuditLogRow[]> {
    return db
      .select({
        id: auditLogs.id,
        actorUserId: auditLogs.actorUserId,
        actorType: auditLogs.actorType,
        action: auditLogs.action,
        targetEntityType: auditLogs.targetEntityType,
        targetEntityId: auditLogs.targetEntityId,
        outcome: auditLogs.outcome,
        ip: auditLogs.ip,
        userAgent: auditLogs.userAgent,
        occurredAt: auditLogs.occurredAt,
      })
      .from(auditLogs)
      .where(
        and(
          gte(auditLogs.occurredAt, filters.since),
          filters.action !== undefined ? eq(auditLogs.action, filters.action) : undefined,
          filters.actorUserId !== undefined
            ? eq(auditLogs.actorUserId, filters.actorUserId)
            : undefined,
          filters.outcome !== undefined
            ? eq(auditLogs.outcome, filters.outcome as "success" | "failure")
            : undefined
        )
      )
      .orderBy(desc(auditLogs.occurredAt))
      .limit(AUDIT_LIST_LIMIT);
  }
}
