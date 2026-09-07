import { Elysia, t } from "elysia";
import { clientIp, recordAudit } from "../../lib/audit";
import {
  adAccountBackfillDto,
  createAdAccountDto,
  deleteAdAccountDto,
  reconnectAdAccountDto,
} from "../../dto/ad-accounts";
import { AdAccountsModel } from "./model";
import { AdAccountsService } from "./service";
import { requireAdmin, requireClientScopedList } from "./guards";
import {
  cancelRun,
  enqueueBackfill,
  enqueueSync,
  latestRun,
  recoverInterruptedRuns,
} from "./queue";

const service = new AdAccountsService(new AdAccountsModel());
void recoverInterruptedRuns();

const idParamsDto = t.Object({ id: t.String() });
const clientIdParamsDto = t.Object({ clientId: t.String() });

export const adAccountsModule = new Elysia()
  .get(
    "/clients/:clientId/ad-accounts",
    async ({ params, headers }) => {
      const user = await requireClientScopedList(headers, params.clientId);
      const rows = await service.listForClient(params.clientId);
      return {
        data:
          user.role === "client"
            ? rows.map(({ tokenType: _tokenType, tokenExpiresAt: _tokenExpiresAt, ...row }) => row)
            : rows,
      };
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
      await requireAdmin(headers);
      return { data: await service.detail(params.id) };
    },
    { params: idParamsDto }
  )
  .get(
    "/ad-accounts/:id/rate-limit",
    async ({ params, headers }) => {
      await requireAdmin(headers);
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
      await requireAdmin(headers);
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
  .post(
    "/ad-accounts/:id/backfill",
    async ({ params, body, headers, set }) => {
      await requireAdmin(headers);
      const result = await enqueueBackfill(params.id, body.months ?? 12);
      set.status = 202;
      return { data: result };
    },
    { params: idParamsDto, body: adAccountBackfillDto }
  );
