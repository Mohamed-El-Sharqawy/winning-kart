import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { insightListDto, insightListQueryDto } from "../../dto/insights";
import { okDto } from "../../dto/alerts";
import { taskResponseDto } from "../../dto/tasks";
import { InsightsModel } from "./model";
import { InsightsService } from "./service";
import { TasksModel } from "../tasks/model";
import { TasksService } from "../tasks/service";
import type { SafeUser } from "../auth/model";

const service = new InsightsService(new InsightsModel(), new TasksService(new TasksModel()));

async function requireUser(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

async function requireAgency(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await requireUser(headers);
  if (user.role === "client") {
    throw problem(403, "FORBIDDEN", "Agency role required");
  }
  return user;
}

async function requireAdmin(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await requireUser(headers);
  if (user.role !== "admin") {
    throw problem(403, "FORBIDDEN", "Admin role required");
  }
  return user;
}

const idParamsDto = t.Object({ id: t.String() });

export const insightsModule = new Elysia({ prefix: "/insights" })
  .get(
    "/",
    async ({ headers, query }) => {
      await requireAgency(headers);
      return { data: await service.list(query.clientId) };
    },
    { query: insightListQueryDto, response: { 200: insightListDto } }
  )
  .post(
    "/:id/accept",
    async ({ params, headers, set }) => {
      await requireAdmin(headers);
      const task = await service.accept(params.id);
      set.status = 201;
      return { data: task };
    },
    { params: idParamsDto, response: { 201: taskResponseDto } }
  )
  .post(
    "/:id/not-useful",
    async ({ params, headers }) => {
      await requireAgency(headers);
      await service.notUseful(params.id);
      return { data: { ok: true } };
    },
    { params: idParamsDto, response: { 200: okDto } }
  );
