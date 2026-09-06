import { t } from "elysia";
import type { TSchema } from "@sinclair/typebox";
import { adSetItemDto, windowQueryFields } from "./performance";

const nullableNumber = t.Union([t.Number(), t.Null()]);
const nullableString = t.Union([t.String(), t.Null()]);

const listQueryFields = {
  ...windowQueryFields,
  status: t.Optional(t.String()),
  q: t.Optional(t.String()),
};

const listPageQueryFields = {
  ...listQueryFields,
  sort: t.Optional(t.String()),
  order: t.Optional(t.String()),
  page: t.Optional(t.String()),
  pageSize: t.Optional(t.String()),
};

export const campaignsListQueryDto = t.Object(listPageQueryFields);

export const adSetsListQueryDto = t.Object({
  ...listPageQueryFields,
  campaignId: t.Optional(t.String()),
});

export const campaignsSummaryQueryDto = t.Object(listQueryFields);

export const adSetsSummaryQueryDto = t.Object({
  ...listQueryFields,
  campaignId: t.Optional(t.String()),
});

function pageEnvelope(items: TSchema) {
  return t.Object({
    data: t.Array(items),
    meta: t.Object({
      page: t.Number(),
      pageSize: t.Number(),
      total: t.Number(),
    }),
  });
}

const campaignItemDto = t.Object({
  id: t.String(),
  name: t.String(),
  status: t.String(),
  objective: nullableString,
  buyingType: nullableString,
  currency: t.String(),
  dailyBudget: nullableString,
  lifetimeBudget: nullableString,
  scheduleStart: nullableString,
  scheduleEnd: nullableString,
  spend: nullableNumber,
  revenue: nullableNumber,
  purchases: nullableNumber,
  roas: nullableNumber,
  cpa: nullableNumber,
  ctr: nullableNumber,
  frequency: nullableNumber,
});

export const campaignsPageDto = pageEnvelope(campaignItemDto);

export const adSetsPageDto = pageEnvelope(adSetItemDto);

export const kpiSummaryDto = t.Object({
  data: t.Object({
    spend: t.Number(),
    revenue: t.Number(),
    purchases: t.Number(),
    roas: nullableNumber,
    cpa: nullableNumber,
    ctr: nullableNumber,
    frequency: nullableNumber,
  }),
});
