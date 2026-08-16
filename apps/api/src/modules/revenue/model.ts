import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { adAccounts, campaigns, clients, db, revenueEvents, revenueSources } from "@wk/db";

export type RevenueSourceRow = typeof revenueSources.$inferSelect;
export type RevenueEventRow = typeof revenueEvents.$inferSelect;
export type MatchTier = RevenueEventRow["matchTier"];
export type ResolvedEntityLevel = RevenueEventRow["resolvedEntityLevel"];

export interface ClientRevenueEventRow {
  id: string;
  sourceOrderId: string;
  tsUtc: Date;
  value: string;
  currency: string;
  matchTier: MatchTier;
  resolvedEntityLevel: ResolvedEntityLevel;
  resolvedEntityId: string | null;
  campaignName: string | null;
  sourceName: string;
}

export interface TierSummaryRow {
  matchTier: MatchTier;
  count: number;
  total: string | null;
}

export class RevenueModel {
  async findActiveSourceByIngestKeyHash(hash: string): Promise<RevenueSourceRow | undefined> {
    const rows = await db
      .select()
      .from(revenueSources)
      .where(and(eq(revenueSources.ingestKeyHash, hash), eq(revenueSources.status, "active")))
      .limit(1);
    return rows[0];
  }

  async findEventByDedupeKey(
    dedupeKey: string
  ): Promise<{ id: string; matchTier: MatchTier } | undefined> {
    const rows = await db
      .select({ id: revenueEvents.id, matchTier: revenueEvents.matchTier })
      .from(revenueEvents)
      .where(eq(revenueEvents.dedupeKey, dedupeKey))
      .limit(1);
    return rows[0];
  }

  async findCampaignByNameForClient(
    clientId: string,
    name: string
  ): Promise<{ id: string } | undefined> {
    const rows = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .innerJoin(adAccounts, eq(campaigns.adAccountId, adAccounts.id))
      .where(and(eq(adAccounts.clientId, clientId), eq(campaigns.name, name)))
      .limit(1);
    return rows[0];
  }

  async insertEvent(values: typeof revenueEvents.$inferInsert): Promise<RevenueEventRow> {
    const rows = await db.insert(revenueEvents).values(values).returning();
    return rows[0];
  }

  async touchSourceLastEventAt(id: string, at: Date): Promise<void> {
    await db
      .update(revenueSources)
      .set({ lastEventAt: at, updatedAt: new Date() })
      .where(eq(revenueSources.id, id));
  }

  async findClientById(id: string): Promise<{ id: string } | undefined> {
    const rows = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0];
  }

  async insertSource(values: typeof revenueSources.$inferInsert): Promise<RevenueSourceRow> {
    const rows = await db.insert(revenueSources).values(values).returning();
    return rows[0];
  }

  async findSourceById(id: string): Promise<RevenueSourceRow | undefined> {
    const rows = await db.select().from(revenueSources).where(eq(revenueSources.id, id)).limit(1);
    return rows[0];
  }

  async updateSourceStatus(
    id: string,
    status: RevenueSourceRow["status"]
  ): Promise<RevenueSourceRow | undefined> {
    const rows = await db
      .update(revenueSources)
      .set({ status, updatedAt: new Date() })
      .where(eq(revenueSources.id, id))
      .returning();
    return rows[0];
  }

  listSourcesForClient(
    clientId: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      status: RevenueSourceRow["status"];
      lastEventAt: Date | null;
      createdAt: Date;
    }>
  > {
    return db
      .select({
        id: revenueSources.id,
        name: revenueSources.name,
        status: revenueSources.status,
        lastEventAt: revenueSources.lastEventAt,
        createdAt: revenueSources.createdAt,
      })
      .from(revenueSources)
      .where(eq(revenueSources.clientId, clientId))
      .orderBy(asc(revenueSources.createdAt));
  }

  listEventsForClient(
    clientId: string,
    since: Date,
    limit: number
  ): Promise<ClientRevenueEventRow[]> {
    return db
      .select({
        id: revenueEvents.id,
        sourceOrderId: revenueEvents.sourceOrderId,
        tsUtc: revenueEvents.tsUtc,
        value: revenueEvents.value,
        currency: revenueEvents.currency,
        matchTier: revenueEvents.matchTier,
        resolvedEntityLevel: revenueEvents.resolvedEntityLevel,
        resolvedEntityId: revenueEvents.resolvedEntityId,
        campaignName: campaigns.name,
        sourceName: revenueSources.name,
      })
      .from(revenueEvents)
      .innerJoin(revenueSources, eq(revenueEvents.revenueSourceId, revenueSources.id))
      .leftJoin(
        campaigns,
        and(
          eq(campaigns.id, revenueEvents.resolvedEntityId),
          eq(revenueEvents.resolvedEntityLevel, "campaign")
        )
      )
      .where(and(eq(revenueEvents.clientId, clientId), gte(revenueEvents.tsUtc, since)))
      .orderBy(desc(revenueEvents.tsUtc))
      .limit(limit);
  }

  summarizeTiersForClient(clientId: string, since: Date): Promise<TierSummaryRow[]> {
    return db
      .select({
        matchTier: revenueEvents.matchTier,
        count: sql<number>`count(*)::int`,
        total: sql<string | null>`sum(${revenueEvents.value})`,
      })
      .from(revenueEvents)
      .where(and(eq(revenueEvents.clientId, clientId), gte(revenueEvents.tsUtc, since)))
      .groupBy(revenueEvents.matchTier);
  }
}
