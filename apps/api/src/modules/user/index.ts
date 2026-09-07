import { Elysia, t } from "elysia";
import { createUserDto, updateUserDto, userListDto } from "../../dto/users";
import { okDto } from "../../dto/alerts";
import { clientIp, recordAudit } from "../../lib/audit";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { DrizzleUserModel } from "./model";
import { UserService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new UserService(new DrizzleUserModel());

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

export const userModule = new Elysia({ prefix: "/users" })
  .get(
    "/",
    async ({ headers }) => {
      await requireAdmin(headers);
      return { data: await service.listUsers() };
    },
    { response: { 200: userListDto } }
  )
  .post(
    "/",
    async ({ body, headers, set }) => {
      await requireAdmin(headers);
      const user = await service.createUser(body);
      set.status = 201;
      return { data: user };
    },
    { body: createUserDto }
  )
  .patch(
    "/:id",
    async ({ params, body, headers }) => {
      const admin = await requireAdmin(headers);
      const user = await service.update(params.id, body);
      void recordAudit({
        actorUserId: admin.id,
        action: "user.update",
        targetEntityType: "user",
        targetEntityId: user.id,
        newValue: { displayName: user.displayName, role: user.role, status: user.status },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      return { data: user };
    },
    { params: idParamsDto, body: updateUserDto }
  )
  .delete(
    "/:id",
    async ({ params, headers }) => {
      const admin = await requireAdmin(headers);
      const user = await service.remove(params.id, admin.id);
      void recordAudit({
        actorUserId: admin.id,
        action: "user.delete",
        targetEntityType: "user",
        targetEntityId: user.id,
        oldValue: { email: user.email, displayName: user.displayName, role: user.role },
        request: { ip: clientIp(headers), userAgent: headers["user-agent"] },
      });
      return { data: { ok: true } };
    },
    { params: idParamsDto, response: { 200: okDto } }
  );
