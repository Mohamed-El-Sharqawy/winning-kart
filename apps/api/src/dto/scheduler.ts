import { t } from "elysia";

const healthStateDto = t.Union([
  t.Literal("healthy"),
  t.Literal("warning"),
  t.Literal("error"),
  t.Literal("disconnected"),
  t.Literal("paused"),
]);

const jobStageDto = t.Union([
  t.Literal("account_info"),
  t.Literal("campaigns"),
  t.Literal("ad_sets"),
  t.Literal("ads"),
  t.Literal("insights"),
  t.Literal("daily_series"),
]);

const jobStatusDto = t.Union([t.Literal("running"), t.Literal("succeeded"), t.Literal("failed")]);

export const schedulerJobsQueryDto = t.Object({
  adAccountId: t.Optional(t.String()),
  status: t.Optional(jobStatusDto),
  hours: t.Optional(t.String({ pattern: "^[0-9]+$" })),
});

const lastJobDto = t.Object({
  stage: jobStageDto,
  status: jobStatusDto,
  errorClass: t.Union([t.String(), t.Null()]),
  endedAt: t.Union([t.Date(), t.Null()]),
});

const schedulerAccountDto = t.Object({
  adAccountId: t.String(),
  name: t.String(),
  healthState: healthStateDto,
  lastSyncAt: t.Union([t.Date(), t.Null()]),
  lastJob: t.Union([lastJobDto, t.Null()]),
  recentFailures: t.Integer(),
});

export const schedulerStatusResponseDto = t.Object({
  data: t.Object({
    enabled: t.Boolean(),
    interval: t.Literal("hourly"),
    accounts: t.Array(schedulerAccountDto),
  }),
});

const schedulerJobDto = t.Object({
  id: t.String(),
  adAccountId: t.String(),
  accountName: t.String(),
  stage: jobStageDto,
  status: jobStatusDto,
  errorClass: t.Union([t.String(), t.Null()]),
  startedAt: t.Date(),
  endedAt: t.Union([t.Date(), t.Null()]),
});

export const schedulerJobsResponseDto = t.Object({ data: t.Array(schedulerJobDto) });
