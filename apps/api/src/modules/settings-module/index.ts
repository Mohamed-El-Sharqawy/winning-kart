import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { clientIp, recordAudit } from "../../lib/audit";
import { okDto } from "../../dto/auth";
import {
  deleteClientDto,
  retentionApplyResponseDto,
  retentionResponseDto,
  updateRetentionDto,
} from "../../dto/settings-module";
import { SettingsModel } from "./model";
import { SettingsService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new SettingsService(new SettingsModel());

const idParamsDto = t.Object({ id: t.String() });

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

function requestContext(headers: Record<string, string | undefined>) {
  return { ip: clientIp(headers), userAgent: headers["user-agent"] };
}

export const settingsModule = new Elysia()
  .get(
    "/settings/retention",
    async ({ headers }) => {
      await requireAdmin(headers);
      return { data: await service.getRetention() };
    },
    { response: { 200: retentionResponseDto } }
  )
  .put(
    "/settings/retention",
    async ({ body, headers }) => {
      const admin = await requireAdmin(headers);
      const result = await service.updateRetention(body.rawInsightsDays);
      await recordAudit({
        actorUserId: admin.id,
        action: "settings.retention_update",
        targetEntityType: "retention_settings",
        targetEntityId: "default",
        oldValue: { rawInsightsDays: result.previous },
        newValue: { rawInsightsDays: result.current },
        request: requestContext(headers),
      });
      return { data: { rawInsightsDays: result.current } };
    },
    { body: updateRetentionDto, response: { 200: retentionResponseDto } }
  )
  .post(
    "/settings/retention/apply",
    async ({ headers }) => {
      const admin = await requireAdmin(headers);
      const result = await service.applyRetention();
      await recordAudit({
        actorUserId: admin.id,
        action: "retention.apply",
        targetEntityType: "retention_settings",
        targetEntityId: "default",
        newValue: { deleted: result.deleted },
        request: requestContext(headers),
      });
      return { data: { deleted: result.deleted } };
    },
    { response: { 200: retentionApplyResponseDto } }
  )
  .get("/export/bundle", async ({ headers, set }) => {
    const admin = await requireAdmin(headers);
    const bundle = await service.exportBundle();
    set.headers["content-type"] = "application/json";
    set.headers["content-disposition"] = 'attachment; filename="winning-kart-export.json"';
    await recordAudit({
      actorUserId: admin.id,
      action: "export.bundle",
      newValue: {
        clients: bundle.clients.length,
        adAccounts: bundle.adAccounts.length,
        campaigns: bundle.campaigns.length,
        adSets: bundle.adSets.length,
        ads: bundle.ads.length,
        dailyInsights: bundle.dailyInsights.length,
        tasks: bundle.tasks.length,
        alerts: bundle.alerts.length,
        insights: bundle.insights.length,
        revenueEvents: bundle.revenueEvents.length,
      },
      request: requestContext(headers),
    });
    return { data: bundle };
  })
  .post(
    "/admin/clients/:id/delete",
    async ({ params, body, headers }) => {
      const admin = await requireAdmin(headers);
      const client = await service.findClientForDelete(params.id);
      if (body.confirmSlug !== client.slug) {
        throw problem(422, "SLUG_MISMATCH", "confirmSlug does not match the client slug");
      }
      await recordAudit({
        actorUserId: admin.id,
        action: "client.delete",
        targetEntityType: "client",
        targetEntityId: client.id,
        newValue: { slug: client.slug },
        request: requestContext(headers),
      });
      await service.deleteClient(params.id, body.confirmSlug);
      return { data: { ok: true } };
    },
    { params: idParamsDto, body: deleteClientDto, response: { 200: okDto } }
  );
