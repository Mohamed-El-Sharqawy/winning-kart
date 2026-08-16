import { t } from "elysia";

export const auditLogsQueryDto = t.Object({
  action: t.Optional(t.String()),
  actorUserId: t.Optional(t.String()),
  outcome: t.Optional(t.String()),
  days: t.Optional(t.String({ pattern: "^[0-9]+$" })),
});

const auditLogDto = t.Object({
  id: t.String(),
  actorUserId: t.Union([t.String(), t.Null()]),
  actorType: t.String(),
  action: t.String(),
  targetEntityType: t.Union([t.String(), t.Null()]),
  targetEntityId: t.Union([t.String(), t.Null()]),
  outcome: t.String(),
  ip: t.Union([t.String(), t.Null()]),
  userAgent: t.Union([t.String(), t.Null()]),
  occurredAt: t.Date(),
});

export const auditLogsResponseDto = t.Object({ data: t.Array(auditLogDto) });
