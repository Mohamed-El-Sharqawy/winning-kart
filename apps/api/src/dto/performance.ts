import { t } from "elysia";

const nullableNumber = t.Union([t.Number(), t.Null()]);
const nullableString = t.Union([t.String(), t.Null()]);

const adSetItemDto = t.Object({
  id: t.String(),
  campaignId: t.String(),
  campaignName: t.String(),
  platformAdsetId: t.String(),
  name: t.String(),
  status: t.String(),
  optimizationGoal: nullableString,
  bidStrategy: nullableString,
  dailyBudget: nullableString,
  currency: t.String(),
  spend: nullableNumber,
  revenue: nullableNumber,
  purchases: nullableNumber,
  roas: nullableNumber,
  cpa: nullableNumber,
  ctr: nullableNumber,
  cpc: nullableNumber,
  cpm: nullableNumber,
  frequency: nullableNumber,
  reach: nullableNumber,
});

const fatigueDto = t.Object({
  flag: t.Union([
    t.Literal("fatiguing"),
    t.Literal("bleeding"),
    t.Literal("scale"),
    t.Literal("status_anomaly"),
  ]),
  reason: t.String(),
});

const adItemDto = t.Object({
  id: t.String(),
  adSetId: t.String(),
  adSetName: t.String(),
  campaignName: t.String(),
  platformAdId: t.String(),
  name: t.String(),
  status: t.String(),
  format: nullableString,
  creativeId: nullableString,
  thumbnailUrl: nullableString,
  previewImageUrl: nullableString,
  previewVideoUrl: nullableString,
  bodyCopy: nullableString,
  spend: nullableNumber,
  revenue: nullableNumber,
  purchases: nullableNumber,
  roas: nullableNumber,
  cpa: nullableNumber,
  ctr: nullableNumber,
  frequency: nullableNumber,
  spendShare: nullableNumber,
  fatigue: t.Union([fatigueDto, t.Null()]),
});

export const performanceAdSetsDto = t.Object({ data: t.Array(adSetItemDto) });

export const performanceAdsDto = t.Object({ data: t.Array(adItemDto) });

export const performanceAdsQueryDto = t.Object({
  days: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  adSetId: t.Optional(t.String()),
});

export const performanceCampaignDto = t.Object({
  data: t.Object({
    adAccountId: t.String(),
    adAccountPlatformId: t.String(),
    accountName: t.String(),
    campaign: t.Object({
      id: t.String(),
      name: t.String(),
      status: t.String(),
      objective: nullableString,
      dailyBudget: nullableString,
      lifetimeBudget: nullableString,
      currency: t.String(),
      spend: nullableNumber,
      revenue: nullableNumber,
      purchases: nullableNumber,
      roas: nullableNumber,
      cpa: nullableNumber,
      ctr: nullableNumber,
      frequency: nullableNumber,
    }),
    series: t.Array(
      t.Object({
        date: t.String(),
        spend: t.Number(),
        revenue: t.Number(),
        roas: nullableNumber,
      })
    ),
    funnel: t.Object({
      impressions: t.Number(),
      reach: t.Number(),
      clicks: t.Number(),
      landingPageViews: t.Number(),
      addToCart: t.Number(),
      initiateCheckout: t.Number(),
      purchases: t.Number(),
      revenue: t.Number(),
    }),
    adSets: t.Array(adSetItemDto),
    ads: t.Array(adItemDto),
  }),
});

export const fatigueSummaryDto = t.Object({
  data: t.Object({
    topCreativeSpendShare: nullableNumber,
    top3SpendShare: nullableNumber,
    concentration: t.Union([t.Literal("top1"), t.Literal("top3"), t.Null()]),
    counts: t.Object({
      fatiguing: t.Number(),
      bleeding: t.Number(),
      scale: t.Number(),
      status_anomaly: t.Number(),
    }),
  }),
});
