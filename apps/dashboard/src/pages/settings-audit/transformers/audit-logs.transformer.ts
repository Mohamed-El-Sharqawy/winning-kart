import type { AuditLogDto } from "../dto/audit-logs.dto";
import type { AuditLog } from "../types/audit-logs.types";

export function toAuditLog(dto: AuditLogDto): AuditLog {
  return {
    id: dto.id,
    actorUserId: dto.actorUserId,
    actorType: dto.actorType,
    action: dto.action,
    targetEntityType: dto.targetEntityType,
    targetEntityId: dto.targetEntityId,
    outcome: dto.outcome,
    ip: dto.ip ?? null,
    userAgent: dto.userAgent ?? null,
    occurredAt: new Date(dto.occurredAt),
  };
}

export function toAuditLogs(dtos: AuditLogDto[]): AuditLog[] {
  return dtos.map(toAuditLog);
}
