import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { schedulerJobsQueryDto, schedulerJobsResponseDto, schedulerStatusResponseDto } from "../../dto/scheduler";
import { SchedulerModel } from "./model";
import { SchedulerService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new SchedulerService(new SchedulerModel());

async function requireAdmin(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  if (user.role !== "admin") {
    throw problem(403, "FORBIDDEN", "Admin role required");
  }
  return user;
}

export const schedulerModule = new Elysia({ prefix: "/scheduler" })
  .get(
    "/status",
    async ({ headers }) => {
      await requireAdmin(headers);
      return { data: await service.status() };
    },
    { response: { 200: schedulerStatusResponseDto } }
  )
  .get(
    "/jobs",
    async ({ headers, query }) => {
      await requireAdmin(headers);
      return { data: await service.listJobs(query) };
    },
    { query: schedulerJobsQueryDto, response: { 200: schedulerJobsResponseDto } }
  );
