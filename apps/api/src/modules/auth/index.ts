import { Elysia, t } from "elysia";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "../../lib/auth";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { createPatDto, loginDto, loginResponseDto, meDto, okDto } from "../../dto/auth";
import { AuthModel } from "./model";
import { AuthService } from "./service";
import type { SafeUser } from "./model";

const service = new AuthService(new AuthModel());

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

export const authModule = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, cookie }) => {
      const user = await service.login(body.email, body.password);
      if (!user) {
        throw problem(401, "INVALID_CREDENTIALS", "Invalid email or password");
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
      return { data: { role: user.role } };
    },
    { body: loginDto, response: { 200: loginResponseDto } }
  )
  .post(
    "/logout",
    ({ cookie }) => {
      cookie[SESSION_COOKIE].remove();
      return { data: { ok: true } };
    },
    { response: { 200: okDto } }
  )
  .get(
    "/me",
    async ({ headers }) => {
      const user = await resolveSessionUser({ cookie: headers.cookie, headers });
      if (!user) {
        throw problem(401, "UNAUTHENTICATED", "Authentication required");
      }
      return {
        data: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          agencyRole: user.agencyRole,
          clientRoleTier: user.clientRoleTier,
        },
      };
    },
    { response: { 200: meDto } }
  )
  .get("/pats", async ({ headers }) => {
    const admin = await requireAdmin(headers);
    return { data: await service.listPats(admin.id) };
  })
  .post(
    "/pats",
    async ({ body, headers, set }) => {
      const admin = await requireAdmin(headers);
      const pat = await service.createPat(admin.id, body.name);
      set.status = 201;
      return { data: pat };
    },
    { body: createPatDto }
  )
  .post(
    "/pats/:id/revoke",
    async ({ params, headers }) => {
      const admin = await requireAdmin(headers);
      const revoked = await service.revokePat(admin.id, params.id);
      if (!revoked) {
        throw problem(404, "RESOURCE_NOT_FOUND", `No personal access token with id ${params.id}`);
      }
      return { data: { ok: true } };
    },
    { params: t.Object({ id: t.String() }), response: { 200: okDto } }
  );
