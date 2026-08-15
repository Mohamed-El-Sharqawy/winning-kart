import { Elysia, t } from "elysia";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "../../lib/auth";
import { resolveSessionUser } from "../../lib/session";
import { createPatDto, errorDto, loginDto, loginResponseDto, meDto, okDto } from "../../dto/auth";
import { AuthModel } from "./model";
import { AuthService } from "./service";
import type { SafeUser } from "./model";

const service = new AuthService(new AuthModel());

async function requireAdmin(
  headers: Record<string, string | undefined>,
  set: { status?: number | string }
): Promise<SafeUser | { error: string }> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user || user.role !== "admin") {
    set.status = 403;
    return { error: "forbidden" };
  }
  return user;
}

export const authModule = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, cookie, set }) => {
      const user = await service.login(body.email, body.password);
      if (!user) {
        set.status = 401;
        return { error: "invalid credentials" };
      }
      const token = await signSession({ sub: user.id, role: user.role });
      cookie[SESSION_COOKIE].set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
        secure: process.env.NODE_ENV === "production",
      });
      return { role: user.role };
    },
    { body: loginDto, response: { 200: loginResponseDto, 401: errorDto } }
  )
  .post(
    "/logout",
    ({ cookie }) => {
      cookie[SESSION_COOKIE].remove();
      return { ok: true };
    },
    { response: { 200: okDto } }
  )
  .get(
    "/me",
    async ({ headers, set }) => {
      const user = await resolveSessionUser({ cookie: headers.cookie, headers });
      if (!user) {
        set.status = 401;
        return { error: "unauthorized" };
      }
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        agencyRole: user.agencyRole,
        clientRoleTier: user.clientRoleTier,
      };
    },
    { response: { 200: meDto, 401: errorDto } }
  )
  .get("/pats", async ({ headers, set }) => {
    const guard = await requireAdmin(headers, set);
    if ("error" in guard) {
      return guard;
    }
    return service.listPats(guard.id);
  })
  .post(
    "/pats",
    async ({ body, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      set.status = 201;
      return service.createPat(guard.id, body.name);
    },
    { body: createPatDto }
  )
  .post(
    "/pats/:id/revoke",
    async ({ params, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const revoked = await service.revokePat(guard.id, params.id);
      if (!revoked) {
        set.status = 404;
        return { error: "not found" };
      }
      return { ok: true };
    },
    { params: t.Object({ id: t.String() }), response: { 200: okDto, 404: errorDto } }
  );
