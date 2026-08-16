import type { SchedulerJobDto, SchedulerStatusDto } from "../dto/scheduler.dto";
import type { SchedulerJob, SchedulerStatus } from "../types/scheduler.types";

function toLastJob(dto: NonNullable<SchedulerStatusDto["accounts"][number]["lastJob"]>) {
  return {
    stage: dto.stage,
    status: dto.status,
    errorClass: dto.errorClass,
    endedAt: new Date(dto.endedAt),
  };
}

export function toSchedulerStatus(dto: SchedulerStatusDto): SchedulerStatus {
  return {
    enabled: dto.enabled,
    interval: dto.interval,
    accounts: dto.accounts.map((account) => ({
      adAccountId: account.adAccountId,
      name: account.name,
      healthState: account.healthState,
      lastSyncAt: account.lastSyncAt ? new Date(account.lastSyncAt) : null,
      lastJob: account.lastJob ? toLastJob(account.lastJob) : null,
      recentFailures: account.recentFailures,
    })),
  };
}

export function toSchedulerJobs(dtos: SchedulerJobDto[]): SchedulerJob[] {
  return dtos.map((job) => {
    const startedAt = new Date(job.startedAt);
    const endedAt = job.endedAt ? new Date(job.endedAt) : null;
    return {
      id: job.id,
      adAccountId: job.adAccountId,
      accountName: job.accountName,
      stage: job.stage,
      status: job.status,
      errorClass: job.errorClass,
      startedAt,
      endedAt,
      durationSeconds:
        endedAt !== null ? Math.max(0, (endedAt.getTime() - startedAt.getTime()) / 1000) : null,
    };
  });
}
