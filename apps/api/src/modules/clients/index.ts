import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { ClientsModel } from "./model";
import { ClientsService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new ClientsService(new ClientsModel());

const createClientDto = t.Object({
  name: t.String({ minLength: 1 }),
  slug: t.String({ minLength: 1 }),
});

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
      await requireAdmin(headers);
      const client = await service.create(body);
      set.status = 201;
      return { data: client };
    },
    { body: createClientDto }
  );
