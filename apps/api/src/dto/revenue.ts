import { t } from "elysia";

export const ingestRevenueDto = t.Object({
  source_order_id: t.String({ minLength: 1, maxLength: 200 }),
  timestamp: t.String({ minLength: 1 }),
  value: t.Number({ exclusiveMinimum: 0 }),
  currency: t.Optional(t.String({ pattern: "^[A-Za-z]{3}$" })),
  status: t.Optional(
    t.Union([t.Literal("paid"), t.Literal("refunded"), t.Literal("cancelled")])
  ),
  customer_ref: t.Optional(t.String({ maxLength: 200 })),
  click_id: t.Optional(
    t.Object({
      fbclid: t.Optional(t.String()),
      _fbp: t.Optional(t.String()),
      _fbc: t.Optional(t.String()),
      gclid: t.Optional(t.String()),
    })
  ),
  utm: t.Optional(
    t.Object({
      source: t.Optional(t.String()),
      medium: t.Optional(t.String()),
      campaign: t.Optional(t.String()),
      content: t.Optional(t.String()),
      term: t.Optional(t.String()),
    })
  ),
  items: t.Optional(t.Array(t.Unknown())),
});

export const revenueDaysQueryDto = t.Object({
  days: t.Optional(t.String({ pattern: "^[0-9]+$" })),
});

export const createRevenueSourceDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});

export const revokeRevenueSourceDto = t.Object({
  confirmName: t.String({ minLength: 1 }),
});
