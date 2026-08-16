import { desc, eq, sql } from "drizzle-orm";
import { clients, db, insights } from "@wk/db";
import type { Insight } from "@wk/db";

export interface InsightRow extends Insight {
  clientName: string;
}

const insightColumns = {
  id: insights.id,
  clientId: insights.clientId,
  adAccountId: insights.adAccountId,
  dedupeKey: insights.dedupeKey,
  insightType: insights.insightType,
  severity: insights.severity,
  entityLevel: insights.entityLevel,
  entityId: insights.entityId,
  entityName: insights.entityName,
  headline: insights.headline,
  deltaPct: insights.deltaPct,
  primaryCause: insights.primaryCause,
  attributionStatus: insights.attributionStatus,
  decomposition: insights.decomposition,
  recommendedAction: insights.recommendedAction,
  ctaTarget: insights.ctaTarget,
  acceptedAsTaskId: insights.acceptedAsTaskId,
  notUsefulCount: insights.notUsefulCount,
  priorityScore: insights.priorityScore,
  detectedAt: insights.detectedAt,
  lastSeenAt: insights.lastSeenAt,
};

export class InsightsModel {
  list(clientId?: string): Promise<InsightRow[]> {
    return db
      .select({ ...insightColumns, clientName: clients.name })
      .from(insights)
      .innerJoin(clients, eq(insights.clientId, clients.id))
      .where(clientId !== undefined ? eq(insights.clientId, clientId) : undefined)
      .orderBy(desc(insights.priorityScore), desc(insights.lastSeenAt));
  }

  async findById(id: string): Promise<Insight | null> {
    const rows = await db
      .select(insightColumns)
      .from(insights)
      .where(eq(insights.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async markAccepted(id: string, taskId: string): Promise<void> {
    await db.update(insights).set({ acceptedAsTaskId: taskId }).where(eq(insights.id, id));
  }

  async incrementNotUseful(id: string): Promise<void> {
    await db
      .update(insights)
      .set({ notUsefulCount: sql`${insights.notUsefulCount} + 1` })
      .where(eq(insights.id, id));
  }
}
