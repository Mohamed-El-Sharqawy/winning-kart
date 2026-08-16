import { t } from "elysia";

export const portalOverviewQueryDto = t.Object({
  days: t.Optional(t.String({ pattern: "^[0-9]+$" })),
});

export const portalOverviewDto = t.Object({
  data: t.Object({
    client: t.Object({
      name: t.String(),
      slug: t.String(),
      displayCurrency: t.String(),
    }),
    kpis: t.Object({
      spend: t.Number(),
      revenue: t.Number(),
      roas: t.Union([t.Number(), t.Null()]),
      purchases: t.Number(),
    }),
    series: t.Array(
      t.Object({
        date: t.String(),
        spend: t.Number(),
        revenue: t.Number(),
        roas: t.Union([t.Number(), t.Null()]),
      })
    ),
    campaigns: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        status: t.String(),
        spend: t.Number(),
        revenue: t.Number(),
        roas: t.Union([t.Number(), t.Null()]),
        purchases: t.Number(),
      })
    ),
    creatives: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        format: t.Union([t.String(), t.Null()]),
        thumbnailUrl: t.Union([t.String(), t.Null()]),
        spend: t.Number(),
        roas: t.Union([t.Number(), t.Null()]),
      })
    ),
  }),
});
