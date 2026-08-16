import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import {
  alertBellDto,
  alertListDto,
  alertListQueryDto,
  detectAdAccountDto,
  dismissAlertDto,
  okDto,
  snoozeAlertDto,
} from "../../dto/alerts";
import { taskResponseDto } from "../../dto/tasks";
import { AlertsModel } from "./model";
import { AlertsService } from "./service";
import { TasksModel } from "../tasks/model";
import { TasksService } from "../tasks/service";
import type { SafeUser } from "../auth/model";

const service = new AlertsService(new AlertsModel(), new TasksService(new TasksModel()));

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

export const alertsModule = new Elysia()
  .get(
    "/alerts/bell",
    async ({ headers }) => {
      await requireAgency(headers);
      return { data: { count: await service.bell() } };
    },
    { response: { 200: alertBellDto } }
  )
  .get(
    "/alerts",
    async ({ headers, query }) => {
      await requireAgency(headers);
      return {
        data: await service.list({
          status: query.status ?? "open",
          clientId: query.clientId,
          severity: query.severity,
        }),
      };
    },
    { query: alertListQueryDto, response: { 200: alertListDto } }
  )
  .post(
    "/alerts/:id/acknowledge",
    async ({ params, headers }) => {
      await requireAdmin(headers);
      await service.acknowledge(params.id);
      return { data: { ok: true } };
    },
    { params: idParamsDto, response: { 200: okDto } }
  )
  .post(
    "/alerts/:id/snooze",
    async ({ params, body, headers }) => {
      await requireAdmin(headers);
      await service.snooze(params.id, body.hours);
      return { data: { ok: true } };
    },
    { params: idParamsDto, body: snoozeAlertDto, response: { 200: okDto } }
  )
  .post(
    "/alerts/:id/dismiss",
    async ({ params, body, headers }) => {
      await requireAdmin(headers);
      await service.dismiss(params.id, body.reason);
      return { data: { ok: true } };
    },
    { params: idParamsDto, body: dismissAlertDto, response: { 200: okDto } }
  )
  .post(
    "/alerts/:id/create-task",
    async ({ params, headers, set }) => {
      await requireAdmin(headers);
      const task = await service.createTask(params.id);
      set.status = 201;
      return { data: task };
    },
    { params: idParamsDto, response: { 201: taskResponseDto } }
  )
  .post(
    "/ad-accounts/:id/detect",
    async ({ params, headers }) => {
      await requireAdmin(headers);
      return { data: await service.detect(params.id) };
    },
    { params: idParamsDto, response: { 200: detectAdAccountDto } }
  );
