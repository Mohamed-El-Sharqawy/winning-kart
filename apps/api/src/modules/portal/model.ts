import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import {
  adAccounts,
  ads,
  adSets,
  campaigns,
  clientUserAssignments,
  clients,
  dailyInsights,
  db,
} from "@wk/db";

export interface PortalClientRow {
  id: string;
  name: string;
  slug: string;
  displayCurrency: string;
}

export interface DailyTotalsRow {
  date: string;
  spend: number;
  revenue: number;
  purchases: number;
}

export interface CampaignMetricsRow {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  purchases: number;
}

export interface CreativeMetricsRow {
  id: string;
  name: string;
  format: string | null;
  thumbnailUrl: string | null;
  spend: number;
  revenue: number;
}

export const CAMPAIGN_LIMIT = 10;
export const CREATIVE_LIMIT = 12;

function parseSum(value: string | null): number {
  if (value === null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class PortalModel {
  async findAssignedClientId(userId: string): Promise<string | null> {
    const rows = await db
      .select({ clientId: clientUserAssignments.clientId })
      .from(clientUserAssignments)
      .where(eq(clientUserAssignments.userId, userId))
      .limit(1);
    return rows[0]?.clientId ?? null;
  }

  async findClientByPrimaryContact(userId: string): Promise<PortalClientRow | null> {
    const rows = await db
      .select({
        id: clients.id,
        name: clients.name,
        slug: clients.slug,
        displayCurrency: clients.displayCurrency,
      })
      .from(clients)
      .where(eq(clients.primaryContactUserId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findClientById(id: string): Promise<PortalClientRow | null> {
    const rows = await db
      .select({
        id: clients.id,
        name: clients.name,
        slug: clients.slug,
        displayCurrency: clients.displayCurrency,
      })
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async accountIdsForClient(clientId: string): Promise<string[]> {
    const rows = await db
      .select({ id: adAccounts.id })
      .from(adAccounts)
      .where(eq(adAccounts.clientId, clientId));
    return rows.map((row) => row.id);
  }

  async accountDailySince(accountIds: string[], since: string): Promise<DailyTotalsRow[]> {
    if (accountIds.length === 0) {
      return [];
    }
    const rows = await db
      .select({
        date: dailyInsights.date,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
        purchases: sql<string>`sum(${dailyInsights.purchases})`,
      })
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.entityLevel, "account"),
          inArray(dailyInsights.adAccountId, accountIds),
          gte(dailyInsights.date, since)
        )
      )
      .groupBy(dailyInsights.date);
    return rows.map((row) => ({
      date: row.date,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
      purchases: Math.round(parseSum(row.purchases)),
    }));
  }

  async campaignMetricsSince(
    accountIds: string[],
    since: string
  ): Promise<CampaignMetricsRow[]> {
    if (accountIds.length === 0) {
      return [];
    }
    const rows = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
        purchases: sql<string>`sum(${dailyInsights.purchases})`,
      })
      .from(campaigns)
      .innerJoin(
        dailyInsights,
        and(eq(dailyInsights.entityLevel, "campaign"), eq(dailyInsights.entityId, campaigns.id))
      )
      .where(and(inArray(campaigns.adAccountId, accountIds), gte(dailyInsights.date, since)))
      .groupBy(campaigns.id, campaigns.name, campaigns.status)
      .orderBy(desc(sql`sum(${dailyInsights.spend})`))
      .limit(CAMPAIGN_LIMIT);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
      purchases: Math.round(parseSum(row.purchases)),
    }));
  }

  async creativeMetricsSince(accountIds: string[], since: string): Promise<CreativeMetricsRow[]> {
    if (accountIds.length === 0) {
      return [];
    }
    const rows = await db
      .select({
        id: ads.id,
        name: ads.name,
        format: ads.format,
        thumbnailUrl: ads.thumbnailUrl,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
      })
      .from(ads)
      .innerJoin(adSets, eq(ads.adSetId, adSets.id))
      .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
      .innerJoin(
        dailyInsights,
        and(eq(dailyInsights.entityLevel, "ad"), eq(dailyInsights.entityId, ads.id))
      )
      .where(and(inArray(campaigns.adAccountId, accountIds), gte(dailyInsights.date, since)))
      .groupBy(ads.id, ads.name, ads.format, ads.thumbnailUrl)
      .orderBy(desc(sql`sum(${dailyInsights.spend})`))
      .limit(CREATIVE_LIMIT);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      format: row.format,
      thumbnailUrl: row.thumbnailUrl,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
    }));
  }
}
