import { t } from "elysia";

export const alertSeverityDto = t.Union([
  t.Literal("critical"),
  t.Literal("warning"),
  t.Literal("info"),
]);

export const alertListQueryDto = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal("open"),
      t.Literal("all"),
      t.Literal("snoozed"),
      t.Literal("acknowledged"),
      t.Literal("suppressed"),
      t.Literal("dismissed"),
    ])
  ),
  clientId: t.Optional(t.String()),
  severity: t.Optional(alertSeverityDto),
});

export const snoozeAlertDto = t.Object({
  hours: t.Union([t.Literal(1), t.Literal(24)]),
});

export const dismissAlertDto = t.Object({
  reason: t.String({ minLength: 3 }),
});

const alertDto = t.Object({
  id: t.String(),
  clientId: t.String(),
  clientName: t.String(),
  adAccountId: t.Union([t.String(), t.Null()]),
  dedupeKey: t.String(),
  triggerType: t.String(),
  severity: t.String(),
  entityLevel: t.String(),
  entityId: t.String(),
  entityName: t.String(),
  whatHappened: t.String(),
  whyItMatters: t.String(),
  supportingMetrics: t.Unknown(),
  recommendedAction: t.String(),
  ctaTarget: t.Union([t.String(), t.Null()]),
  status: t.String(),
  snoozedUntil: t.Union([t.Date(), t.Null()]),
  dismissedReason: t.Union([t.String(), t.Null()]),
  suppressedByTaskId: t.Union([t.String(), t.Null()]),
  priorityScore: t.Number(),
  detectedAt: t.Date(),
  lastSeenAt: t.Date(),
});

export const alertListDto = t.Object({ data: t.Array(alertDto) });

export const alertBellDto = t.Object({ data: t.Object({ count: t.Number() }) });

export const okDto = t.Object({ data: t.Object({ ok: t.Boolean() }) });

export const detectAdAccountDto = t.Object({
  data: t.Object({ alerts: t.Unknown(), insights: t.Unknown() }),
});
