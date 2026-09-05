import { t } from "elysia";
import { fatigueDto, windowQueryFields } from "./performance";

const nullableNumber = t.Union([t.Number(), t.Null()]);
const nullableString = t.Union([t.String(), t.Null()]);

const adMetricsDto = t.Object({
  spend: nullableNumber,
  revenue: nullableNumber,
  purchases: nullableNumber,
  roas: nullableNumber,
  cpa: nullableNumber,
  ctr: nullableNumber,
  frequency: nullableNumber,
});

const adTrendDto = t.Object({
  spend: t.Number(),
  ctr: nullableNumber,
});

const galleryAdItemDto = t.Object({
  id: t.String(),
  name: t.String(),
  status: t.String(),
  format: nullableString,
  adSetId: t.String(),
  adSetName: t.String(),
  campaignId: t.String(),
  campaignName: t.String(),
  thumbnailUrl: nullableString,
  videoId: nullableString,
  carouselCount: nullableNumber,
  bodyCopy: nullableString,
  metrics: t.Union([adMetricsDto, t.Null()]),
  spendShare: nullableNumber,
  trend: adTrendDto,
  fatigue: t.Union([fatigueDto, t.Null()]),
});

export const adsListQueryDto = t.Object({
  ...windowQueryFields,
  status: t.Optional(t.String()),
  adSetId: t.Optional(t.String()),
  campaignId: t.Optional(t.String()),
  flag: t.Optional(t.String()),
  format: t.Optional(t.String()),
  q: t.Optional(t.String()),
  sort: t.Optional(t.String()),
  order: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  cursor: t.Optional(t.String()),
});

export const adsListPageDto = t.Object({
  data: t.Object({
    items: t.Array(galleryAdItemDto),
    nextCursor: t.Union([t.String(), t.Null()]),
  }),
});
