import { Elysia } from "elysia";
import { UserService } from "./service";
import { UserModel } from "./model";

const service = new UserService(new UserModel());

export const userModule = new Elysia({ prefix: "/users" }).get("/", async ({ headers, set }) => {
  void headers;
  set.status = 501;
  return { error: "user module lands in M0 (RBAC discriminators, invites)" };
});
