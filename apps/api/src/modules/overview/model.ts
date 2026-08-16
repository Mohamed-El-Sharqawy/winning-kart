import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { adAccounts, clients, dailyInsights, db, syncJobs } from "@wk/db";

export interface AccountLevelTotals {
  spend: number;
  revenue: number;
  purchases: number;
}

export interface HealthCounts {
  total: number;
  healthy: number;
}

export interface UnhealthyAccount {
  id: string;
  name: string;
  healthState: string;
  tokenType: "system_user" | "user_60d";
  tokenExpiresAt: Date | null;
  lastSyncAt: Date | null;
}

export interface ClientSpendRow {
  clientId: string;
  spend: number;
  revenue: number;
}

export interface LatestJobRow {
  adAccountId: string;
  stage: string;
  status: string;
  errorClass: string | null;
}

function parseSum(value: string | null): number {
  if (value === null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class OverviewModel {
  async accountTotalsSince(since: string): Promise<AccountLevelTotals> {
    const rows = await db
      .select({
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
        purchases: sql<string>`sum(${dailyInsights.purchases})`,
      })
      .from(dailyInsights)
      .where(and(eq(dailyInsights.entityLevel, "account"), gte(dailyInsights.date, since)));
    const row = rows[0];
    return {
      spend: parseSum(row?.spend ?? null),
      revenue: parseSum(row?.revenue ?? null),
      purchases: Math.round(parseSum(row?.purchases ?? null)),
    };
  }

  async healthCounts(): Promise<HealthCounts> {
    const rows = await db
      .select({
        total: sql<number>`count(*)::int`,
        healthy: sql<number>`cast(count(*) filter (where ${adAccounts.healthState} = 'healthy') as int)`,
      })
      .from(adAccounts);
    return rows[0] ?? { total: 0, healthy: 0 };
  }

  unhealthyAccounts(): Promise<UnhealthyAccount[]> {
    return db
      .select({
        id: adAccounts.id,
        name: adAccounts.name,
        healthState: adAccounts.healthState,
        tokenType: adAccounts.tokenType,
        tokenExpiresAt: adAccounts.tokenExpiresAt,
        lastSyncAt: adAccounts.lastSyncAt,
      })
      .from(adAccounts)
      .where(ne(adAccounts.healthState, "healthy"))
      .orderBy(adAccounts.name);
  }

  async latestJobsFor(accountIds: string[]): Promise<LatestJobRow[]> {
    if (accountIds.length === 0) {
      return [];
    }
    return db
      .select({
        adAccountId: syncJobs.adAccountId,
        stage: syncJobs.stage,
        status: syncJobs.status,
        errorClass: syncJobs.errorClass,
      })
      .from(syncJobs)
      .where(inArray(syncJobs.adAccountId, accountIds))
      .orderBy(desc(syncJobs.startedAt))
      .limit(500);
  }

  listClients(): Promise<{ id: string; name: string; slug: string }[]> {
    return db.select({ id: clients.id, name: clients.name, slug: clients.slug }).from(clients);
  }

  async clientIdsWithAccounts(): Promise<Set<string>> {
    const rows = await db
      .selectDistinct({ clientId: adAccounts.clientId })
      .from(adAccounts);
    return new Set(rows.map((row) => row.clientId));
  }

  async clientSpendSince(since: string): Promise<ClientSpendRow[]> {
    const rows = await db
      .select({
        clientId: adAccounts.clientId,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
      })
      .from(dailyInsights)
      .innerJoin(adAccounts, eq(dailyInsights.adAccountId, adAccounts.id))
      .where(and(eq(dailyInsights.entityLevel, "account"), gte(dailyInsights.date, since)))
      .groupBy(adAccounts.clientId);
    return rows.map((row) => ({
      clientId: row.clientId,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
    }));
  }
}
