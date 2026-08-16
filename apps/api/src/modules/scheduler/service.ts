import type {
  LastJobRow,
  SchedulerJobFilters,
  SchedulerJobRow,
  SchedulerModel,
} from "./model";

export interface SchedulerJobsQuery {
  adAccountId?: string;
  status?: string;
  hours?: string;
}

export interface SchedulerLastJob {
  stage: "account_info" | "campaigns" | "ad_sets" | "ads" | "insights" | "daily_series";
  status: "running" | "succeeded" | "failed";
  errorClass: string | null;
  endedAt: Date | null;
}

export interface SchedulerAccountStatus {
  adAccountId: string;
  name: string;
  healthState: "healthy" | "warning" | "error" | "disconnected" | "paused";
  lastSyncAt: Date | null;
  lastJob: SchedulerLastJob | null;
  recentFailures: number;
}

export interface SchedulerStatus {
  enabled: boolean;
  interval: "hourly";
  accounts: SchedulerAccountStatus[];
}

const HOUR_MS = 3600000;
const DEFAULT_HOURS = 24;
const MAX_HOURS = 168;
const RECENT_FAILURE_HOURS = 24;

export class SchedulerService {
  constructor(private readonly model: SchedulerModel) {}

  async status(): Promise<SchedulerStatus> {
    const accounts = await this.model.listAccounts();
    const accountIds = accounts.map((account) => account.id);
    const failureSince = new Date(Date.now() - RECENT_FAILURE_HOURS * HOUR_MS);
    const [lastJobs, failureCounts] = await Promise.all([
      this.model.lastJobPerAccount(accountIds),
      this.model.failureCountsSince(failureSince),
    ]);
    return {
      enabled: process.env.WK_SYNC_CRON !== "off",
      interval: "hourly",
      accounts: accounts.map((account) => ({
        adAccountId: account.id,
        name: account.name,
        healthState: account.healthState,
        lastSyncAt: account.lastSyncAt,
        lastJob: toLastJob(lastJobs.get(account.id)),
        recentFailures: failureCounts.get(account.id) ?? 0,
      })),
    };
  }

  listJobs(query: SchedulerJobsQuery): Promise<SchedulerJobRow[]> {
    return this.model.listJobs(toFilters(query));
  }
}

function toLastJob(row: LastJobRow | undefined): SchedulerLastJob | null {
  if (!row) {
    return null;
  }
  return { stage: row.stage, status: row.status, errorClass: row.errorClass, endedAt: row.endedAt };
}

function toFilters(query: SchedulerJobsQuery): SchedulerJobFilters {
  return {
    adAccountId: nonEmpty(query.adAccountId),
    status: parseStatus(query.status),
    since: new Date(Date.now() - parseHours(query.hours) * HOUR_MS),
  };
}

function parseHours(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_HOURS), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_HOURS;
  }
  return Math.min(Math.max(parsed, 1), MAX_HOURS);
}

function parseStatus(value: string | undefined): SchedulerJobFilters["status"] {
  if (value === "running" || value === "succeeded" || value === "failed") {
    return value;
  }
  return undefined;
}

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.length > 0 ? value : undefined;
}
