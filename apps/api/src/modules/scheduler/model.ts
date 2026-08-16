import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { adAccounts, db, syncJobs } from "@wk/db";

type JobStage = "account_info" | "campaigns" | "ad_sets" | "ads" | "insights" | "daily_series";
type JobStatus = "running" | "succeeded" | "failed";

export interface SchedulerAccountRow {
  id: string;
  name: string;
  healthState: "healthy" | "warning" | "error" | "disconnected" | "paused";
  lastSyncAt: Date | null;
}

export interface LastJobRow {
  adAccountId: string;
  stage: JobStage;
  status: JobStatus;
  errorClass: string | null;
  endedAt: Date | null;
}

export interface SchedulerJobFilters {
  adAccountId?: string;
  status?: JobStatus;
  since: Date;
}

export interface SchedulerJobRow {
  id: string;
  adAccountId: string;
  accountName: string;
  stage: JobStage;
  status: JobStatus;
  errorClass: string | null;
  startedAt: Date;
  endedAt: Date | null;
}

const LAST_JOBS_FETCH_LIMIT = 500;
const JOBS_LIST_LIMIT = 100;

export class SchedulerModel {
  listAccounts(): Promise<SchedulerAccountRow[]> {
    return db
      .select({
        id: adAccounts.id,
        name: adAccounts.name,
        healthState: adAccounts.healthState,
        lastSyncAt: adAccounts.lastSyncAt,
      })
      .from(adAccounts)
      .orderBy(adAccounts.name);
  }

  async lastJobPerAccount(accountIds: string[]): Promise<Map<string, LastJobRow>> {
    if (accountIds.length === 0) {
      return new Map();
    }
    const rows = await db
      .select({
        adAccountId: syncJobs.adAccountId,
        stage: syncJobs.stage,
        status: syncJobs.status,
        errorClass: syncJobs.errorClass,
        endedAt: syncJobs.endedAt,
      })
      .from(syncJobs)
      .where(inArray(syncJobs.adAccountId, accountIds))
      .orderBy(desc(syncJobs.startedAt))
      .limit(LAST_JOBS_FETCH_LIMIT);
    const byAccount = new Map<string, LastJobRow>();
    for (const row of rows) {
      if (!byAccount.has(row.adAccountId)) {
        byAccount.set(row.adAccountId, row);
      }
    }
    return byAccount;
  }

  async failureCountsSince(since: Date): Promise<Map<string, number>> {
    const rows = await db
      .select({
        adAccountId: syncJobs.adAccountId,
        failures: sql<number>`count(*)::int`,
      })
      .from(syncJobs)
      .where(and(eq(syncJobs.status, "failed"), gte(syncJobs.startedAt, since)))
      .groupBy(syncJobs.adAccountId);
    return new Map(rows.map((row): [string, number] => [row.adAccountId, row.failures]));
  }

  listJobs(filters: SchedulerJobFilters): Promise<SchedulerJobRow[]> {
    return db
      .select({
        id: syncJobs.id,
        adAccountId: syncJobs.adAccountId,
        accountName: adAccounts.name,
        stage: syncJobs.stage,
        status: syncJobs.status,
        errorClass: syncJobs.errorClass,
        startedAt: syncJobs.startedAt,
        endedAt: syncJobs.endedAt,
      })
      .from(syncJobs)
      .innerJoin(adAccounts, eq(syncJobs.adAccountId, adAccounts.id))
      .where(
        and(
          gte(syncJobs.startedAt, filters.since),
          filters.adAccountId !== undefined
            ? eq(syncJobs.adAccountId, filters.adAccountId)
            : undefined,
          filters.status !== undefined ? eq(syncJobs.status, filters.status) : undefined
        )
      )
      .orderBy(desc(syncJobs.startedAt))
      .limit(JOBS_LIST_LIMIT);
  }
}
