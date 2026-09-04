import { and, desc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { adAccounts, alerts, clients, db } from "@wk/db";
import type { Alert } from "@wk/db";

export type AlertListStatus =
  | "open"
  | "all"
  | "snoozed"
  | "acknowledged"
  | "suppressed"
  | "dismissed";

export interface AlertListFilter {
  status: AlertListStatus;
  clientId?: string;
  severity?: Alert["severity"];
}

export interface AlertUpdatePatch {
  status?: Alert["status"];
  snoozedUntil?: Date | null;
  dismissedReason?: string | null;
  suppressedByTaskId?: string | null;
}

export interface AlertRow extends Alert {
  clientName: string;
}

const alertColumns = {
  id: alerts.id,
  clientId: alerts.clientId,
  adAccountId: alerts.adAccountId,
  dedupeKey: alerts.dedupeKey,
  triggerType: alerts.triggerType,
  severity: alerts.severity,
  entityLevel: alerts.entityLevel,
  entityId: alerts.entityId,
  entityName: alerts.entityName,
  whatHappened: alerts.whatHappened,
  whyItMatters: alerts.whyItMatters,
  supportingMetrics: alerts.supportingMetrics,
  recommendedAction: alerts.recommendedAction,
  ctaTarget: alerts.ctaTarget,
  status: alerts.status,
  snoozedUntil: alerts.snoozedUntil,
  dismissedReason: alerts.dismissedReason,
  suppressedByTaskId: alerts.suppressedByTaskId,
  priorityScore: alerts.priorityScore,
  detectedAt: alerts.detectedAt,
  lastSeenAt: alerts.lastSeenAt,
};

function expiredSnooze() {
  return and(eq(alerts.status, "snoozed"), lt(alerts.snoozedUntil, new Date()));
}

function effectiveOpen() {
  return or(eq(alerts.status, "open"), expiredSnooze());
}

export class AlertsModel {
  list(filter: AlertListFilter): Promise<AlertRow[]> {
    let statusCondition;
    if (filter.status === "all") {
      statusCondition = undefined;
    } else if (filter.status === "open") {
      statusCondition = effectiveOpen();
    } else if (filter.status === "snoozed") {
      statusCondition = and(
        eq(alerts.status, "snoozed"),
        or(isNull(alerts.snoozedUntil), gte(alerts.snoozedUntil, new Date()))
      );
    } else {
      statusCondition = eq(alerts.status, filter.status);
    }
    const conditions = [
      statusCondition,
      filter.clientId !== undefined ? eq(alerts.clientId, filter.clientId) : undefined,
      filter.severity !== undefined ? eq(alerts.severity, filter.severity) : undefined,
    ];
    return db
      .select({ ...alertColumns, clientName: clients.name })
      .from(alerts)
      .innerJoin(clients, eq(alerts.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(alerts.priorityScore), desc(alerts.lastSeenAt))
      .limit(500);
  }

  async bellCount(): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(alerts)
      .where(and(effectiveOpen(), inArray(alerts.severity, ["critical", "warning"])));
    return rows[0]?.count ?? 0;
  }

  async findById(id: string): Promise<Alert | null> {
    const rows = await db.select(alertColumns).from(alerts).where(eq(alerts.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async update(id: string, patch: AlertUpdatePatch): Promise<Alert | null> {
    const rows = await db.update(alerts).set(patch).where(eq(alerts.id, id)).returning();
    return rows[0] ?? null;
  }

  async adAccountExists(id: string): Promise<boolean> {
    const rows = await db
      .select({ id: adAccounts.id })
      .from(adAccounts)
      .where(eq(adAccounts.id, id))
      .limit(1);
    return rows.length > 0;
  }
}
