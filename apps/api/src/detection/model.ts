import { and, between, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import { adAccounts, ads, alerts, campaigns, dailyInsights, db, insights, tasks } from "@wk/db";
import { cohortStats } from "./fatigue";
import type { CohortAdRow } from "./fatigue";
import { PerformanceModel } from "../modules/performance/model";
import { DATA_TRUST_RULES } from "./rules";
import type {
  AccountSnapshot,
  AdFatigueDatum,
  ClientAdPurchases,
  DetectionData,
  EntityWindow,
  RuleKey,
  Severity,
} from "./rules";
import { round2 } from "../platforms/meta";

const DAY_MS = 86400000;
const DISMISS_GRACE_MS = 72 * 3600000;

const WHY_IT_MATTERS: Record<string, string> = {
  roas_drop: "Revenue per dirham of spend is falling — margin compresses first.",
  cpa_spike: "Each acquisition costs more on steady volume.",
  spend_no_conversions: "Budget is deploying with nothing coming back.",
  creative_fatigue: "The creative is burning impressions on the same people.",
  conversion_concentration: "A single ad carries most purchases — one fatigue event would cripple delivery.",
  token_expiring: "Data freshness is at risk — syncs stop when the token lapses.",
  token_expired: "Data is stale — syncs are failing on the expired token.",
  account_restricted: "Ads may have stopped serving — resolve on Meta.",
};

const RECOMMENDED_ACTION: Record<string, string> = {
  roas_drop: "Open the client's campaigns and inspect the drivers.",
  cpa_spike: "Review creative and audience cost drivers.",
  spend_no_conversions: "Pause or restructure the campaign.",
  creative_fatigue: "Refresh the creative.",
  conversion_concentration: "Diversify — scale a runner-up creative.",
  token_expiring: "Reconnect the account with a fresh token.",
  token_expired: "Reconnect the account with a fresh token.",
  account_restricted: "Resolve the restriction in Meta Business Manager, then reconnect.",
};

export interface AlertUpsertValues {
  clientId: string;
  adAccountId: string;
  ruleKey: RuleKey;
  entityLevel: string;
  entityId: string;
  entityName: string | null;
  severity: Severity;
  whatHappened: string;
  headline: string;
  supportingMetrics: Record<string, unknown>;
  priorityScore: number;
}

export interface InsightUpsertValues {
  clientId: string;
  adAccountId: string;
  insightType: string;
  entityLevel: string;
  entityId: string;
  entityName: string | null;
  severity: Severity;
  headline: string;
  supportingMetrics: Record<string, unknown>;
  attributionStatus: "attributed" | "unattributed" | null;
  priorityScore: number;
}

interface ExistingAlert {
  id: string;
  status: string;
  lastSeenAt: Date;
  suppressedByTaskId: string | null;
  snoozedUntil: Date | null;
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

function ctrRate(clicks: number, impressions: number): number | null {
  return impressions > 0 ? (clicks / impressions) * 100 : null;
}

function shiftDate(date: string, offsetDays: number): string {
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + offsetDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function detectionWindows(): { priorSince: string; recentSince: string; until: string } {
  const until = new Date().toISOString().slice(0, 10);
  const recentSince = shiftDate(until, -6);
  const priorSince = shiftDate(recentSince, -7);
  return { priorSince, recentSince, until };
}

function payloadStatus(payload: unknown): number | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const raw = (payload as Record<string, unknown>).accountStatusRaw;
  return typeof raw === "number" ? raw : null;
}

export class DetectionModel {
  async loadRecentWindows(accountId: string): Promise<DetectionData | null> {
    const accountRows = await db
      .select({
        id: adAccounts.id,
        clientId: adAccounts.clientId,
        name: adAccounts.name,
        tokenType: adAccounts.tokenType,
        tokenExpiresAt: adAccounts.tokenExpiresAt,
        platformPayload: adAccounts.platformPayload,
      })
      .from(adAccounts)
      .where(eq(adAccounts.id, accountId))
      .limit(1);
    if (accountRows.length === 0) {
      return null;
    }
    const accountRow = accountRows[0];
    const account: AccountSnapshot = {
      id: accountRow.id,
      clientId: accountRow.clientId,
      name: accountRow.name,
      tokenType: accountRow.tokenType,
      tokenExpiresAt: accountRow.tokenExpiresAt,
      accountStatusRaw: payloadStatus(accountRow.platformPayload),
    };
    const { priorSince, recentSince, until } = detectionWindows();
    const perf = new PerformanceModel();
    const [windowRows, campaignRows, firstSeenRows, adEntities, adSums, adSetSums, trendRows, purchaseRows, clientSpendRows] =
      await Promise.all([
        db
          .select({
            entityLevel: dailyInsights.entityLevel,
            entityId: dailyInsights.entityId,
            spendRecent: sql<string>`sum(${dailyInsights.spend}) filter (where ${dailyInsights.date} >= ${recentSince})`,
            spendPrior: sql<string>`sum(${dailyInsights.spend}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
            revenueRecent: sql<string>`sum(${dailyInsights.revenue}) filter (where ${dailyInsights.date} >= ${recentSince})`,
            revenuePrior: sql<string>`sum(${dailyInsights.revenue}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
            purchasesRecent: sql<string>`sum(${dailyInsights.purchases}) filter (where ${dailyInsights.date} >= ${recentSince})`,
            purchasesPrior: sql<string>`sum(${dailyInsights.purchases}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
            clicksRecent: sql<string>`sum(${dailyInsights.clicks}) filter (where ${dailyInsights.date} >= ${recentSince})`,
            clicksPrior: sql<string>`sum(${dailyInsights.clicks}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
            impressionsRecent: sql<string>`sum(${dailyInsights.impressions}) filter (where ${dailyInsights.date} >= ${recentSince})`,
            impressionsPrior: sql<string>`sum(${dailyInsights.impressions}) filter (where ${dailyInsights.date} >= ${priorSince} and ${dailyInsights.date} < ${recentSince})`,
          })
          .from(dailyInsights)
          .where(
            and(
              eq(dailyInsights.adAccountId, accountId),
              inArray(dailyInsights.entityLevel, ["account", "campaign"]),
              between(dailyInsights.date, priorSince, until)
            )
          )
          .groupBy(dailyInsights.entityLevel, dailyInsights.entityId),
        db
          .select({ id: campaigns.id, name: campaigns.name })
          .from(campaigns)
          .where(eq(campaigns.adAccountId, accountId)),
        db
          .select({
            entityId: dailyInsights.entityId,
            firstSeen: sql<string>`min(${dailyInsights.date})`,
          })
          .from(dailyInsights)
          .where(
            and(
              eq(dailyInsights.adAccountId, accountId),
              eq(dailyInsights.entityLevel, "campaign")
            )
          )
          .groupBy(dailyInsights.entityId),
        perf.listAds(accountId),
        perf.windowMetrics(accountId, "ad", recentSince, until),
        perf.windowMetrics(accountId, "adset", recentSince, until),
        perf.adTrendMetrics(accountId, priorSince, recentSince, until),
        db
          .select({
            adId: dailyInsights.entityId,
            adAccountId: dailyInsights.adAccountId,
            adName: ads.name,
            purchases: sql<string>`sum(${dailyInsights.purchases})`,
          })
          .from(dailyInsights)
          .innerJoin(adAccounts, eq(adAccounts.id, dailyInsights.adAccountId))
          .leftJoin(ads, eq(ads.id, dailyInsights.entityId))
          .where(
            and(
              eq(adAccounts.clientId, account.clientId),
              eq(dailyInsights.entityLevel, "ad"),
              between(dailyInsights.date, recentSince, until)
            )
          )
          .groupBy(dailyInsights.entityId, dailyInsights.adAccountId, ads.name),
        db
          .select({ total: sql<string>`sum(${dailyInsights.spend})` })
          .from(dailyInsights)
          .innerJoin(adAccounts, eq(adAccounts.id, dailyInsights.adAccountId))
          .where(
            and(
              eq(adAccounts.clientId, account.clientId),
              eq(dailyInsights.entityLevel, "account"),
              between(dailyInsights.date, recentSince, until)
            )
          ),
      ]);
    const campaignNames = new Map(campaignRows.map((row) => [row.id, row.name]));
    const windows: EntityWindow[] = windowRows.map((row) => ({
      level: row.entityLevel === "campaign" ? "campaign" : "account",
      id: row.entityId,
      name:
        row.entityLevel === "campaign"
          ? (campaignNames.get(row.entityId) ?? null)
          : account.name,
      spendRecent: parseSum(row.spendRecent),
      spendPrior: parseSum(row.spendPrior),
      revenueRecent: parseSum(row.revenueRecent),
      revenuePrior: parseSum(row.revenuePrior),
      purchasesRecent: toCount(row.purchasesRecent),
      purchasesPrior: toCount(row.purchasesPrior),
      ctrRecent: ctrRate(toCount(row.clicksRecent), toCount(row.impressionsRecent)),
      ctrPrior: ctrRate(toCount(row.clicksPrior), toCount(row.impressionsPrior)),
    }));
    const campaignFirstSeen = new Map(
      firstSeenRows.map((row) => [row.entityId, row.firstSeen])
    );
    const adSumsById = new Map(adSums.map((row) => [row.entityId, row]));
    const adSetSpendById = new Map(adSetSums.map((row) => [row.entityId, row.spend]));
    const trendById = new Map(trendRows.map((row) => [row.entityId, row]));
    const cohortRows: CohortAdRow[] = [];
    const prepared = adEntities.map((row) => {
      const sums = adSumsById.get(row.id);
      const trend = trendById.get(row.id);
      const cohortSpend = adSetSpendById.get(row.adSetId) ?? 0;
      const spend = sums?.spend ?? 0;
      const roas =
        sums !== undefined && sums.spend > 0 ? round2(sums.revenue / sums.spend) : null;
      const frequency =
        sums !== undefined && sums.reach > 0 ? round2(sums.impressions / sums.reach) : null;
      const spendShare = cohortSpend > 0 && sums !== undefined ? spend / cohortSpend : null;
      cohortRows.push({ adSetId: row.adSetId, roas, spendRecent: trend?.spendRecent ?? 0 });
      return { row, spend, roas, frequency, spendShare, trend };
    });
    const stats = cohortStats(cohortRows);
    const adData: AdFatigueDatum[] = prepared.map((entry) => {
      const stat = stats.get(entry.row.adSetId);
      return {
        adId: entry.row.id,
        adName: entry.row.name,
        adSetId: entry.row.adSetId,
        spendRecent: entry.spend,
        input: {
          adId: entry.row.id,
          adStatus: entry.row.status,
          parentAdSetStatus: entry.row.parentAdSetStatus,
          spendRecent: entry.trend?.spendRecent ?? 0,
          spendPrior: entry.trend?.spendPrior ?? 0,
          ctrRecent:
            entry.trend === undefined
              ? null
              : ctrRate(entry.trend.clicksRecent, entry.trend.impressionsRecent),
          ctrPrior:
            entry.trend === undefined
              ? null
              : ctrRate(entry.trend.clicksPrior, entry.trend.impressionsPrior),
          frequency: entry.frequency,
          roas: entry.roas,
          spendShare: entry.spendShare,
          cohortMedianRoas: stat === undefined ? null : stat.medianRoas,
          cohortMedianSpend: stat === undefined ? null : stat.medianSpend,
        },
      };
    });
    const clientAdPurchases: ClientAdPurchases[] = purchaseRows.map((row) => ({
      adId: row.adId,
      adName: row.adName,
      adAccountId: row.adAccountId,
      purchases: toCount(row.purchases),
    }));
    return {
      today: until,
      account,
      windows,
      campaignFirstSeen,
      ads: adData,
      clientAdPurchases,
      clientSpendRecent: parseSum(clientSpendRows[0]?.total ?? null),
    };
  }

  async listExistingAlertKeys(dedupeKeys: string[]): Promise<Set<string>> {
    if (dedupeKeys.length === 0) {
      return new Set();
    }
    const rows = await db
      .select({ dedupeKey: alerts.dedupeKey })
      .from(alerts)
      .where(inArray(alerts.dedupeKey, dedupeKeys));
    return new Set(rows.map((row) => row.dedupeKey));
  }

  async countRecentAlerts(clientId: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 3600000);
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(alerts)
      .where(
        and(
          eq(alerts.clientId, clientId),
          gte(alerts.detectedAt, since),
          notInArray(alerts.triggerType, [...DATA_TRUST_RULES])
        )
      );
    return rows[0]?.count ?? 0;
  }

  private async taskOpen(taskId: string | null): Promise<boolean> {
    if (taskId === null) {
      return false;
    }
    const rows = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    const status = rows[0]?.status;
    return status === "todo" || status === "in_progress";
  }

  private async alertHeld(row: ExistingAlert, now: Date): Promise<boolean> {
    if (
      row.status === "dismissed" &&
      now.getTime() - row.lastSeenAt.getTime() < DISMISS_GRACE_MS
    ) {
      return true;
    }
    if (row.status === "suppressed" && (await this.taskOpen(row.suppressedByTaskId))) {
      return true;
    }
    if (
      row.status === "snoozed" &&
      row.snoozedUntil !== null &&
      row.snoozedUntil.getTime() > now.getTime()
    ) {
      return true;
    }
    return false;
  }

  async upsertAlert(dedupeKey: string, values: AlertUpsertValues): Promise<void> {
    const now = new Date();
    const existing = await db
      .select({
        id: alerts.id,
        status: alerts.status,
        lastSeenAt: alerts.lastSeenAt,
        suppressedByTaskId: alerts.suppressedByTaskId,
        snoozedUntil: alerts.snoozedUntil,
      })
      .from(alerts)
      .where(eq(alerts.dedupeKey, dedupeKey))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(alerts).values({
        id: crypto.randomUUID(),
        dedupeKey,
        status: "open",
        lastSeenAt: now,
        detectedAt: now,
        clientId: values.clientId,
        adAccountId: values.adAccountId,
        triggerType: values.ruleKey,
        entityLevel: values.entityLevel as "account" | "campaign" | "adset" | "ad",
        entityId: values.entityId,
        entityName: values.entityName ?? "",
        severity: values.severity,
        whatHappened: values.whatHappened,
        whyItMatters: WHY_IT_MATTERS[values.ruleKey] ?? "Performance signal detected.",
        recommendedAction: RECOMMENDED_ACTION[values.ruleKey] ?? "Inspect the entity in its workspace surface.",
        supportingMetrics: values.supportingMetrics,
        priorityScore: values.priorityScore.toFixed(2),
      });
      return;
    }
    const row = existing[0];
    if (await this.alertHeld(row, now)) {
      await db.update(alerts).set({ lastSeenAt: now }).where(eq(alerts.id, row.id));
      return;
    }
    const patch: Partial<typeof alerts.$inferInsert> = {
      severity: values.severity,
      whatHappened: values.whatHappened,
      supportingMetrics: values.supportingMetrics,
      priorityScore: values.priorityScore.toFixed(2),
      entityName: values.entityName ?? "",
      lastSeenAt: now,
    };
    if (row.status !== "open") {
      patch.status = "open";
    }
    await db.update(alerts).set(patch).where(eq(alerts.id, row.id));
  }

  async upsertInsight(dedupeKey: string, values: InsightUpsertValues): Promise<void> {
    const now = new Date();
    const existing = await db
      .select({ id: insights.id })
      .from(insights)
      .where(eq(insights.dedupeKey, dedupeKey))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(insights).values({
        id: crypto.randomUUID(),
        dedupeKey,
        lastSeenAt: now,
        detectedAt: now,
        clientId: values.clientId,
        adAccountId: values.adAccountId,
        insightType: values.insightType as
          | "roas_drop"
          | "cpa_spike"
          | "spend_no_conversions"
          | "creative_fatigue"
          | "conversion_concentration",
        entityLevel: values.entityLevel as "account" | "campaign" | "adset" | "ad",
        entityId: values.entityId,
        entityName: values.entityName ?? "",
        severity: values.severity,
        headline: values.headline,
        recommendedAction:
          RECOMMENDED_ACTION[values.insightType] ?? "Inspect the entity in its workspace surface.",
        decomposition: values.supportingMetrics,
        attributionStatus: values.attributionStatus ?? "unattributed",
        priorityScore: values.priorityScore.toFixed(2),
      });
      return;
    }
    await db
      .update(insights)
      .set({
        severity: values.severity,
        headline: values.headline,
        decomposition: values.supportingMetrics,
        attributionStatus: values.attributionStatus ?? "unattributed",
        priorityScore: values.priorityScore.toFixed(2),
        entityName: values.entityName ?? "",
        lastSeenAt: now,
      })
      .where(eq(insights.id, existing[0].id));
  }
}
