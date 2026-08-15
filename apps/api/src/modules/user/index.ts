import { Elysia } from "elysia";
import { createUserDto, userListDto } from "../../dto/users";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { UserModel } from "./model";
import { UserService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new UserService(new UserModel());

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
  );
