import { t } from "elysia";

export const insightListQueryDto = t.Object({
  clientId: t.Optional(t.String()),
});

const insightDto = t.Object({
  id: t.String(),
  clientId: t.String(),
  clientName: t.String(),
  adAccountId: t.Union([t.String(), t.Null()]),
  dedupeKey: t.String(),
  insightType: t.String(),
  severity: t.String(),
  entityLevel: t.String(),
  entityId: t.String(),
  entityName: t.String(),
  headline: t.String(),
  deltaPct: t.Union([t.Number(), t.Null()]),
  primaryCause: t.Union([t.String(), t.Null()]),
  attributionStatus: t.String(),
  decomposition: t.Unknown(),
  recommendedAction: t.String(),
  ctaTarget: t.Union([t.String(), t.Null()]),
  acceptedAsTaskId: t.Union([t.String(), t.Null()]),
  notUsefulCount: t.Number(),
  priorityScore: t.Number(),
  detectedAt: t.Date(),
  lastSeenAt: t.Date(),
});

export const insightListDto = t.Object({ data: t.Array(insightDto) });
