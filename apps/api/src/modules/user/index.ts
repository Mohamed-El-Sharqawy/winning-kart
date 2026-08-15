import { Elysia } from "elysia";
import { createUserDto, userListDto } from "../../dto/users";
import { errorDto } from "../../dto/auth";
import { resolveSessionUser } from "../../lib/session";
import { UserModel } from "./model";
import { UserService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new UserService(new UserModel());

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

export const userModule = new Elysia({ prefix: "/users" })
  .get(
    "/",
    async ({ headers, set }) => {
      const guard = await requireAdmin(headers, set);
      if ("error" in guard) {
        return guard;
      }
      return service.listUsers();
    },
    { response: { 200: userListDto, 401: errorDto, 403: errorDto } }
  )
  .post("/", async ({ body, headers, set }) => {
    const guard = await requireAdmin(headers, set);
    if ("error" in guard) {
      return guard;
    }
    const result = await service.createUser(body);
    if (!result.ok) {
      set.status = 409;
      return { error: "email already taken" };
    }
    set.status = 201;
    return result.user;
  }, { body: createUserDto });
