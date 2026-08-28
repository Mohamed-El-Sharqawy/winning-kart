import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { clientIp, recordAudit } from "../../lib/audit";
import {
  adAccountCampaignsQueryDto,
  createAdAccountDto,
  deleteAdAccountDto,
  reconnectAdAccountDto,
} from "../../dto/ad-accounts";
import { AdAccountsModel } from "./model";
import { AdAccountsService } from "./service";
import { cancelRun, enqueueSync, latestRun, recoverInterruptedRuns } from "./queue";
import type { SafeUser } from "../auth/model";

const service = new AdAccountsService(new AdAccountsModel());
void recoverInterruptedRuns();

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
    async ({ params, headers }) => {
      await requireUser(headers);
      return { data: await service.listForClient(params.clientId) };
    },
    { params: clientIdParamsDto }
  )
  .post(
    "/clients/:clientId/ad-accounts",
    async ({ params, body, headers, set }) => {
      const admin = await requireAdmin(headers);
      const account = await service.create(params.clientId, body);
      void recordAudit({
        actorUserId: admin.id,
        action: "ad_account.create",
        targetEntityType: "ad_account",
        targetEntityId: account.id,
        newValue: { adAccountId: account.adAccountId },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      set.status = 201;
      return { data: account };
    },
    { params: clientIdParamsDto, body: createAdAccountDto }
  )
  .get(
    "/ad-accounts/:id",
    async ({ params, headers }) => {
      await requireUser(headers);
      return { data: await service.detail(params.id) };
    },
    { params: idParamsDto }
  )
  .get(
    "/ad-accounts/:id/rate-limit",
    async ({ params, headers }) => {
      await requireUser(headers);
      return { data: await service.rateLimit(params.id) };
    },
    { params: idParamsDto }
  )
  .post(
    "/ad-accounts/:id/sync",
    async ({ params, headers, set }) => {
      await requireAdmin(headers);
      const result = await enqueueSync(params.id);
      set.status = 202;
      return { data: result };
    },
    { params: idParamsDto }
  )
  .get(
    "/ad-accounts/:id/sync/runs/latest",
    async ({ params, headers }) => {
      await requireUser(headers);
      return { data: await latestRun(params.id) };
    },
    { params: idParamsDto }
  )
  .post(
    "/ad-accounts/:id/sync/runs/:runId/cancel",
    async ({ params, headers }) => {
      await requireAdmin(headers);
      return { data: { ok: await cancelRun(params.id, params.runId) } };
    },
    { params: t.Object({ id: t.String(), runId: t.String() }) }
  )
  .post(
    "/ad-accounts/:id/reconnect",
    async ({ params, body, headers }) => {
      const admin = await requireAdmin(headers);
      await service.reconnect(params.id, body.accessToken, body.tokenType);
      void recordAudit({
        actorUserId: admin.id,
        action: "ad_account.reconnect",
        targetEntityType: "ad_account",
        targetEntityId: params.id,
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      return { data: { ok: true } };
    },
    { params: idParamsDto, body: reconnectAdAccountDto }
  )
  .delete(
    "/ad-accounts/:id",
    async ({ params, body, headers }) => {
      const admin = await requireAdmin(headers);
      const account = await service.detail(params.id);
      void recordAudit({
        actorUserId: admin.id,
        action: "ad_account.delete",
        targetEntityType: "ad_account",
        targetEntityId: account.id,
        oldValue: { slug: account.slug },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      await service.remove(params.id, body.confirmSlug);
      return { data: { ok: true } };
    },
    { params: idParamsDto, body: deleteAdAccountDto }
  )
  .get(
    "/ad-accounts/:id/campaigns",
    async ({ params, query, headers }) => {
      await requireUser(headers);
      return {
        data: await service.campaignsWithMetrics(params.id, parseDays(query.days)),
      };
    },
    { params: idParamsDto, query: adAccountCampaignsQueryDto }
  );
