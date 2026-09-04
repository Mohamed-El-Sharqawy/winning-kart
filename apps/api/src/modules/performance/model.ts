import { and, asc, between, eq, sql } from "drizzle-orm";
import { adAccounts, ads, adSets, campaigns, dailyInsights, db } from "@wk/db";

type EntityLevel = (typeof dailyInsights.$inferSelect)["entityLevel"];

export interface AdSetEntityRow {
  id: string;
  campaignId: string;
  campaignName: string;
  platformAdsetId: string;
  name: string;
  status: string;
  optimizationGoal: string | null;
  bidStrategy: string | null;
  dailyBudget: string | null;
  currency: string;
}

export interface AdEntityRow {
  id: string;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  platformAdId: string;
  name: string;
  status: string;
  format: string | null;
  creativeId: string | null;
  thumbnailUrl: string | null;
  bodyCopy: string | null;
  parentAdSetStatus: string;
}

export interface CampaignEntityRow {
  id: string;
  adAccountId: string;
  adAccountPlatformId: string;
  accountName: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  currency: string;
}

export interface WindowSums {
  entityId: string;
  spend: number;
  revenue: number;
  purchases: number;
  clicks: number;
  impressions: number;
  reach: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
}

export interface AdTrendSums {
  entityId: string;
  spendRecent: number;
  spendPrior: number;
  clicksRecent: number;
  impressionsRecent: number;
  clicksPrior: number;
  impressionsPrior: number;
}

export interface CampaignDailyRow {
  date: string;
  spend: number;
  revenue: number;
}

function parseSum(value: string | null): number {
  if (value === null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCount(value: string | null): number {
  return Math.round(parseSum(value));
}

export class PerformanceModel {
  async findAccount(id: string): Promise<{ id: string } | undefined> {
    const rows = await db
      .select({ id: adAccounts.id })
      .from(adAccounts)
      .where(eq(adAccounts.id, id))
      .limit(1);
    return rows[0];
  }

  async findCampaign(id: string): Promise<CampaignEntityRow | undefined> {
    const rows = await db
      .select({
        id: campaigns.id,
        adAccountId: campaigns.adAccountId,
        adAccountPlatformId: adAccounts.adAccountId,
        accountName: adAccounts.name,
        name: campaigns.name,
        status: campaigns.status,
        objective: campaigns.objective,
        dailyBudget: campaigns.dailyBudget,
        lifetimeBudget: campaigns.lifetimeBudget,
        currency: campaigns.currency,
      })
      .from(campaigns)
      .innerJoin(adAccounts, eq(campaigns.adAccountId, adAccounts.id))
      .where(eq(campaigns.id, id))
      .limit(1);
    return rows[0];
  }

  listAdSets(adAccountId: string): Promise<AdSetEntityRow[]> {
    return db
      .select({
        id: adSets.id,
        campaignId: adSets.campaignId,
        campaignName: campaigns.name,
        platformAdsetId: adSets.platformAdsetId,
        name: adSets.name,
        status: adSets.status,
        optimizationGoal: adSets.optimizationGoal,
        bidStrategy: adSets.bidStrategy,
        dailyBudget: adSets.dailyBudget,
        currency: campaigns.currency,
      })
      .from(adSets)
      .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
      .where(eq(campaigns.adAccountId, adAccountId))
      .orderBy(adSets.name);
  }

  listAds(adAccountId: string, adSetId?: string): Promise<AdEntityRow[]> {
    return db
      .select({
        id: ads.id,
        adSetId: ads.adSetId,
        adSetName: adSets.name,
        campaignId: campaigns.id,
        campaignName: campaigns.name,
        platformAdId: ads.platformAdId,
        name: ads.name,
        status: ads.status,
        format: ads.format,
        creativeId: ads.creativeId,
        thumbnailUrl: ads.thumbnailUrl,
        bodyCopy: ads.bodyCopy,
        parentAdSetStatus: adSets.status,
      })
      .from(ads)
      .innerJoin(adSets, eq(ads.adSetId, adSets.id))
      .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
      .where(
        and(
          eq(campaigns.adAccountId, adAccountId),
          adSetId === undefined ? undefined : eq(ads.adSetId, adSetId)
        )
      )
      .orderBy(ads.name);
  }

  async windowMetrics(
    adAccountId: string,
    level: EntityLevel,
    since: string,
    until: string
  ): Promise<WindowSums[]> {
    const rows = await db
      .select({
        entityId: dailyInsights.entityId,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
        purchases: sql<string>`sum(${dailyInsights.purchases})`,
        clicks: sql<string>`sum(${dailyInsights.clicks})`,
        impressions: sql<string>`sum(${dailyInsights.impressions})`,
        reach: sql<string>`sum(${dailyInsights.reach})`,
        landingPageViews: sql<string>`sum(${dailyInsights.landingPageViews})`,
        addToCart: sql<string>`sum(${dailyInsights.addToCart})`,
        initiateCheckout: sql<string>`sum(${dailyInsights.initiateCheckout})`,
      })
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.adAccountId, adAccountId),
          eq(dailyInsights.entityLevel, level),
          between(dailyInsights.date, since, until)
        )
      )
      .groupBy(dailyInsights.entityId);
    return rows.map((row) => ({
      entityId: row.entityId,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
      purchases: toCount(row.purchases),
      clicks: toCount(row.clicks),
      impressions: toCount(row.impressions),
      reach: toCount(row.reach),
      landingPageViews: toCount(row.landingPageViews),
      addToCart: toCount(row.addToCart),
      initiateCheckout: toCount(row.initiateCheckout),
    }));
  }

  async adTrendMetrics(
    adAccountId: string,
    priorSince: string,
    recentSince: string,
    until: string
  ): Promise<AdTrendSums[]> {
    const rows = await db
      .select({
        entityId: dailyInsights.entityId,
        spendRecent: sql<string>`sum(${dailyInsights.spend}) filter (where ${dailyInsights.date} >= ${recentSince})`,
        spendPrior: sql<string>`sum(${dailyInsights.spend}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
        clicksRecent: sql<string>`sum(${dailyInsights.clicks}) filter (where ${dailyInsights.date} >= ${recentSince})`,
        clicksPrior: sql<string>`sum(${dailyInsights.clicks}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
        impressionsRecent: sql<string>`sum(${dailyInsights.impressions}) filter (where ${dailyInsights.date} >= ${recentSince})`,
        impressionsPrior: sql<string>`sum(${dailyInsights.impressions}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
      })
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.adAccountId, adAccountId),
          eq(dailyInsights.entityLevel, "ad"),
          between(dailyInsights.date, priorSince, until)
        )
      )
      .groupBy(dailyInsights.entityId);
    return rows.map((row) => ({
      entityId: row.entityId,
      spendRecent: parseSum(row.spendRecent),
      spendPrior: parseSum(row.spendPrior),
      clicksRecent: toCount(row.clicksRecent),
      impressionsRecent: toCount(row.impressionsRecent),
      clicksPrior: toCount(row.clicksPrior),
      impressionsPrior: toCount(row.impressionsPrior),
    }));
  }

  async campaignSeries(
    adAccountId: string,
    campaignId: string,
    since: string,
    until: string
  ): Promise<CampaignDailyRow[]> {
    const rows = await db
      .select({
        date: dailyInsights.date,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
      })
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.adAccountId, adAccountId),
          eq(dailyInsights.entityLevel, "campaign"),
          eq(dailyInsights.entityId, campaignId),
          between(dailyInsights.date, since, until)
        )
      )
      .groupBy(dailyInsights.date)
      .orderBy(asc(dailyInsights.date));
    return rows.map((row) => ({
      date: row.date,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
    }));
  }
}
