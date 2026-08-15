import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import {
  adAccountCampaignsQueryDto,
  createAdAccountDto,
  deleteAdAccountDto,
  reconnectAdAccountDto,
} from "../../dto/ad-accounts";
import { AdAccountsModel } from "./model";
import { AdAccountsService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new AdAccountsService(new AdAccountsModel());

async function requireUser(
  headers: Record<string, string | undefined>,
  set: { status?: number | string }
): Promise<SafeUser | { error: string }> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    set.status = 401;
    return { error: "unauthorized" };
  }
  return user;
}

async function requireAdmin(
  headers: Record<string, string | undefined>,
  set: { status?: number | string }
): Promise<SafeUser | { error: string }> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    set.status = 401;
    return { error: "unauthorized" };
  }
  if (user.role !== "admin") {
    set.status = 403;
    return { error: "forbidden" };
  }
  return user;
}

const idParamsDto = t.Object({ id: t.String() });
const clientIdParamsDto = t.Object({ clientId: t.String() });

function parseDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "30", 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.min(Math.max(parsed, 1), 90);
}

export const adAccountsModule = new Elysia()
  .get(
    "/clients/:clientId/ad-accounts",
    async ({ params, headers, set }) => {
      const guard = await requireUser(headers, set);
      if ("error" in guard) {
        return guard;
      }
      return service.listForClient(params.clientId);
    },
    { params: clientIdParamsDto }
  )
  .post(
    "/clients/:clientId/ad-accounts",
    async ({ params, body, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const result = await service.create(params.clientId, body);
      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.error };
      }
      set.status = 201;
      return result.account;
    },
    { params: clientIdParamsDto, body: createAdAccountDto }
  )
  .get(
    "/ad-accounts/:id",
    async ({ params, headers, set }) => {
      const guard = await requireUser(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const detail = await service.detail(params.id);
      if (!detail) {
        set.status = 404;
        return { error: "not found" };
      }
      return detail;
    },
    { params: idParamsDto }
  )
  .post(
    "/ad-accounts/:id/sync",
    async ({ params, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const outcome = await service.sync(params.id);
      if (!outcome) {
        set.status = 404;
        return { error: "not found" };
      }
      return outcome;
    },
    { params: idParamsDto }
  )
  .post(
    "/ad-accounts/:id/reconnect",
    async ({ params, body, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const result = await service.reconnect(params.id, body.accessToken);
      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.error };
      }
      return { ok: true };
    },
    { params: idParamsDto, body: reconnectAdAccountDto }
  )
  .delete(
    "/ad-accounts/:id",
    async ({ params, body, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const result = await service.remove(params.id, body.confirmSlug);
      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.error };
      }
      return { ok: true };
    },
    { params: idParamsDto, body: deleteAdAccountDto }
  )
  .get(
    "/ad-accounts/:id/campaigns",
    async ({ params, query, headers, set }) => {
      const guard = await requireUser(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const campaigns = await service.campaignsWithMetrics(params.id, parseDays(query.days));
      if (!campaigns) {
        set.status = 404;
        return { error: "not found" };
      }
      return campaigns;
    },
    { params: idParamsDto, query: adAccountCampaignsQueryDto }
  );
