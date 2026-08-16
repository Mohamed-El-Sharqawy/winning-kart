import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import {
  createTaskDto,
  taskListDto,
  taskListQueryDto,
  taskResponseDto,
  updateTaskDto,
} from "../../dto/tasks";
import { TasksModel } from "./model";
import { TasksService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new TasksService(new TasksModel());

async function requireAgency(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  if (user.role === "client") {
    throw problem(403, "FORBIDDEN", "Agency role required");
  }
  return user;
}

const idParamsDto = t.Object({ id: t.String() });

export const tasksModule = new Elysia({ prefix: "/tasks" })
  .get(
    "/",
    async ({ headers, query }) => {
      await requireAgency(headers);
      return {
        data: await service.list({ status: query.status, assigneeUserId: query.assignee }),
      };
    },
    { query: taskListQueryDto, response: { 200: taskListDto } }
  )
  .post(
    "/",
    async ({ body, headers, set }) => {
      await requireAgency(headers);
      const task = await service.create(body);
      set.status = 201;
      return { data: task };
    },
    { body: createTaskDto, response: { 201: taskResponseDto } }
  )
  .patch(
    "/:id",
    async ({ params, body, headers }) => {
      await requireAgency(headers);
      return { data: await service.update(params.id, body) };
    },
    { params: idParamsDto, body: updateTaskDto, response: { 200: taskResponseDto } }
  );
