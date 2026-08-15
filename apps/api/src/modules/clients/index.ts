import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { ClientsModel } from "./model";
import { ClientsService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new ClientsService(new ClientsModel());

const createClientDto = t.Object({
  name: t.String({ minLength: 1 }),
  slug: t.String({ minLength: 1 }),
});

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

export const clientsModule = new Elysia({ prefix: "/clients" })
  .get("/", async ({ headers, set }) => {
    const guard = await requireUser(headers, set);
    if ("error" in guard) {
      return guard;
    }
    return service.list();
  })
  .post(
    "/",
    async ({ body, headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      const result = await service.create(body);
      if (!result.ok) {
        set.status = 409;
        return { error: "slug already taken" };
      }
      set.status = 201;
      return result.client;
    },
    { body: createClientDto }
  );
