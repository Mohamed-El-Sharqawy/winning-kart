import { t } from "elysia";

export const overviewDto = t.Object({
  data: t.Object({
    spend: t.Number(),
    revenue: t.Number(),
    roas: t.Union([t.Number(), t.Null()]),
    cpa: t.Union([t.Number(), t.Null()]),
    purchases: t.Number(),
    accountsHealthy: t.Number(),
    accountsTotal: t.Number(),
    issues: t.Array(
      t.Object({
        adAccountId: t.String(),
        name: t.String(),
        healthState: t.String(),
        lastSyncAt: t.Union([t.Date(), t.Null()]),
        errorHint: t.String(),
      })
    ),
    clients: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        slug: t.String(),
        spend: t.Number(),
        revenue: t.Number(),
        roas: t.Union([t.Number(), t.Null()]),
        purchases: t.Number(),
        cpa: t.Union([t.Number(), t.Null()]),
      })
    ),
    insights: t.Array(
      t.Object({
        id: t.String(),
        severity: t.String(),
        headline: t.String(),
        entityName: t.String(),
        ctaTarget: t.Union([t.String(), t.Null()]),
      })
    ),
  }),
});
