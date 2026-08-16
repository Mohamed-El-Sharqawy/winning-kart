import { t } from "elysia";

export const retentionDto = t.Object({
  rawInsightsDays: t.Integer(),
});

export const retentionResponseDto = t.Object({ data: retentionDto });

export const updateRetentionDto = t.Object({
  rawInsightsDays: t.Integer({ minimum: 7, maximum: 3650 }),
});

export const retentionApplyResponseDto = t.Object({
  data: t.Object({ deleted: t.Integer() }),
});

export const deleteClientDto = t.Object({
  confirmSlug: t.String({ minLength: 1 }),
});
