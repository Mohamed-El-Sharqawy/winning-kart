export interface SchedulerLastJob {
  stage: string;
  status: string;
  errorClass: string | null;
  endedAt: Date;
}

export interface SchedulerAccount {
  adAccountId: string;
  name: string;
  healthState: string;
  lastSyncAt: Date | null;
  lastJob: SchedulerLastJob | null;
  recentFailures: number;
}

export interface SchedulerStatus {
  enabled: boolean;
  interval: string;
  accounts: SchedulerAccount[];
}

export interface SchedulerJob {
  id: string;
  adAccountId: string;
  accountName: string;
  stage: string;
  status: string;
  errorClass: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
}

export interface SchedulerJobFilters {
  adAccountId: string;
  status: string;
  hours: number;
}
