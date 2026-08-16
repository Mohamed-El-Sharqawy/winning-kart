import { and, eq, lt, ne } from "drizzle-orm";
import {
  adAccounts,
  ads,
  adSets,
  alerts,
  campaigns,
  clients,
  dailyInsights,
  db,
  insights,
  retentionSettings,
  revenueEvents,
  tasks,
} from "@wk/db";
import type {
  Ad,
  AdAccount,
  AdSet,
  Alert,
  Campaign,
  Client,
  DailyInsight,
  Insight,
  RetentionSetting,
  RevenueEvent,
  Task,
} from "@wk/db";

export const RETENTION_ROW_ID = "default";
export const DEFAULT_RAW_INSIGHTS_DAYS = 90;

export interface ExportBundle {
  clients: Client[];
  adAccounts: AdAccount[];
  campaigns: Campaign[];
  adSets: AdSet[];
  ads: Ad[];
  dailyInsights: DailyInsight[];
  tasks: Task[];
  alerts: Alert[];
  insights: Insight[];
  revenueEvents: RevenueEvent[];
}

export class SettingsModel {
  async findRetention(): Promise<RetentionSetting | null> {
    const rows = await db
      .select()
      .from(retentionSettings)
      .where(eq(retentionSettings.id, RETENTION_ROW_ID))
      .limit(1);
    return rows[0] ?? null;
  }

  async insertDefaultRetention(): Promise<void> {
    await db
      .insert(retentionSettings)
      .values({
        id: RETENTION_ROW_ID,
        rawInsightsDays: DEFAULT_RAW_INSIGHTS_DAYS,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async updateRetention(rawInsightsDays: number): Promise<RetentionSetting> {
    const rows = await db
      .update(retentionSettings)
      .set({ rawInsightsDays, updatedAt: new Date() })
      .where(eq(retentionSettings.id, RETENTION_ROW_ID))
      .returning();
    return rows[0];
  }

  async deleteRawInsightsBefore(cutoff: string): Promise<number> {
    const rows = await db
      .delete(dailyInsights)
      .where(and(ne(dailyInsights.entityLevel, "account"), lt(dailyInsights.date, cutoff)))
      .returning({ id: dailyInsights.id });
    return rows.length;
  }

  async findClientById(id: string): Promise<Client | null> {
    const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async deleteClient(id: string): Promise<boolean> {
    const rows = await db.delete(clients).where(eq(clients.id, id)).returning({ id: clients.id });
    return rows.length > 0;
  }

  async exportBundle(): Promise<ExportBundle> {
    const [
      clientRows,
      adAccountRows,
      campaignRows,
      adSetRows,
      adRows,
      dailyInsightRows,
      taskRows,
      alertRows,
      insightRows,
      revenueEventRows,
    ] = await Promise.all([
      db.select().from(clients),
      db.select().from(adAccounts),
      db.select().from(campaigns),
      db.select().from(adSets),
      db.select().from(ads),
      db.select().from(dailyInsights),
      db.select().from(tasks),
      db.select().from(alerts),
      db.select().from(insights),
      db.select().from(revenueEvents),
    ]);
    return {
      clients: clientRows,
      adAccounts: adAccountRows,
      campaigns: campaignRows,
      adSets: adSetRows,
      ads: adRows,
      dailyInsights: dailyInsightRows,
      tasks: taskRows,
      alerts: alertRows,
      insights: insightRows,
      revenueEvents: revenueEventRows,
    };
  }
}
