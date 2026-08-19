import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { clientIp, recordAudit } from "../../lib/audit";
import { createClientDto, deleteClientDto, updateClientDto } from "../../dto/clients";
import { ClientsModel } from "./model";
import { ClientsService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new ClientsService(new ClientsModel());

const clientIdParamsDto = t.Object({ clientId: t.String() });

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

export const clientsModule = new Elysia({ prefix: "/clients" })
  .get("/", async ({ headers }) => {
    await requireUser(headers);
    return { data: await service.list() };
  })
  .post(
    "/",
    async ({ body, headers, set }) => {
      const admin = await requireAdmin(headers);
      const client = await service.create(body);
      void recordAudit({
        actorUserId: admin.id,
        action: "client.create",
        targetEntityType: "client",
        targetEntityId: client.id,
        newValue: { slug: client.slug },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      set.status = 201;
      return { data: client };
    },
    { body: createClientDto }
  )
  .get(
    "/:clientId",
    async ({ params, headers }) => {
      await requireUser(headers);
      return { data: await service.detail(params.clientId) };
    },
    { params: clientIdParamsDto }
  )
  .patch(
    "/:clientId",
    async ({ params, body, headers }) => {
      const admin = await requireAdmin(headers);
      const client = await service.update(params.clientId, body);
      void recordAudit({
        actorUserId: admin.id,
        action: "client.update",
        targetEntityType: "client",
        targetEntityId: client.id,
        newValue: { name: client.name, slug: client.slug },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      return { data: client };
    },
    { params: clientIdParamsDto, body: updateClientDto }
  )
  .delete(
    "/:clientId",
    async ({ params, body, headers }) => {
      const admin = await requireAdmin(headers);
      const client = await service.detail(params.clientId);
      void recordAudit({
        actorUserId: admin.id,
        action: "client.delete",
        targetEntityType: "client",
        targetEntityId: client.id,
        oldValue: { slug: client.slug, name: client.name },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      await service.remove(params.clientId, body.confirmSlug);
      return { data: { ok: true } };
    },
    { params: clientIdParamsDto, body: deleteClientDto }
  );
