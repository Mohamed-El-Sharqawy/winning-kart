import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import {
  createRevenueSourceDto,
  ingestRevenueDto,
  revenueDaysQueryDto,
  revokeRevenueSourceDto,
} from "../../dto/revenue";
import { RevenueModel } from "./model";
import { RevenueService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new RevenueService(new RevenueModel());

async function requireUser(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
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

async function requireAgency(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await requireUser(headers);
  if (user.role === "client") {
    throw problem(403, "FORBIDDEN", "Agency access required");
  }
  return user;
}

function bearerKey(headers: Record<string, string | undefined>): string | null {
  const authorization = headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return null;
  }
  const key = authorization.slice("Bearer ".length).trim();
  return key.length > 0 ? key : null;
}

function requestContext(headers: Record<string, string | undefined>): {
  ip?: string;
  userAgent?: string;
} {
  const ip = headers["x-forwarded-for"];
  const userAgent = headers["user-agent"];
  return {
    ...(typeof ip === "string" ? { ip } : {}),
    ...(typeof userAgent === "string" ? { userAgent } : {}),
  };
}

function parseDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "30", 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.min(Math.max(parsed, 1), 90);
}

const clientIdParamsDto = t.Object({ clientId: t.String() });
const sourceIdParamsDto = t.Object({ clientId: t.String(), id: t.String() });

export const revenueModule = new Elysia()
  .post(
    "/revenue/ingest",
    async ({ body, headers, set }) => {
      const result = await service.ingest({
        bearerKey: bearerKey(headers),
        body,
        request: requestContext(headers),
      });
      set.status = 202;
      return { data: result };
    },
    { body: ingestRevenueDto }
  )
  .get(
    "/clients/:clientId/revenue",
    async ({ params, query, headers }) => {
      await requireAgency(headers);
      return {
        data: await service.listClientRevenue(params.clientId, parseDays(query.days)),
      };
    },
    { params: clientIdParamsDto, query: revenueDaysQueryDto }
  )
  .post(
    "/clients/:clientId/revenue-sources",
    async ({ params, body, headers, set }) => {
      const user = await requireAdmin(headers);
      const source = await service.createSource({
        clientId: params.clientId,
        name: body.name,
        actorUserId: user.id,
        request: requestContext(headers),
      });
      set.status = 201;
      return { data: source };
    },
    { params: clientIdParamsDto, body: createRevenueSourceDto }
  )
  .get(
    "/clients/:clientId/revenue-sources",
    async ({ params, headers }) => {
      await requireUser(headers);
      return { data: await service.listSources(params.clientId) };
    },
    { params: clientIdParamsDto }
  )
  .delete(
    "/clients/:clientId/revenue-sources/:id",
    async ({ params, body, headers }) => {
      const user = await requireAdmin(headers);
      await service.revokeSource({
        clientId: params.clientId,
        id: params.id,
        confirmName: body.confirmName,
        actorUserId: user.id,
        request: requestContext(headers),
      });
      return { data: { ok: true } };
    },
    { params: sourceIdParamsDto, body: revokeRevenueSourceDto }
  );
