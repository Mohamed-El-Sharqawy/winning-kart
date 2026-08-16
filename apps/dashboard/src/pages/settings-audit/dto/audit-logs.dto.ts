export interface AuditLogDto {
  id: string;
  actorUserId: string;
  actorType: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  outcome: string;
  ip: string | null;
  userAgent: string | null;
  occurredAt: string;
}
