export interface SchedulerLastJobDto {
  stage: string;
  status: string;
  errorClass: string | null;
  endedAt: string;
}

export interface SchedulerAccountDto {
  adAccountId: string;
  name: string;
  healthState: string;
  lastSyncAt: string | null;
  lastJob: SchedulerLastJobDto | null;
  recentFailures: number;
}

export interface SchedulerStatusDto {
  enabled: boolean;
  interval: string;
  accounts: SchedulerAccountDto[];
}

export interface SchedulerJobDto {
  id: string;
  adAccountId: string;
  accountName: string;
  stage: string;
  status: string;
  errorClass: string | null;
  startedAt: string;
  endedAt: string | null;
}
