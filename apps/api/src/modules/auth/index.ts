import { Elysia } from "elysia";
import { t } from "elysia";
import { loginDto, createPatDto, sessionDto } from "../../dto/auth";
import { AuthService } from "./service";
import { AuthModel } from "./model";

const service = new AuthService(new AuthModel());

export const authModule = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await service.login(body.email, body.password);
      if (!result) {
        set.status = 401;
        return { error: "invalid credentials" };
      }
      return result;
    },
    { body: loginDto, response: { 200: sessionDto, 401: t.Object({ error: t.String() }) } }
  )
  .post("/logout", () => ({ ok: true }))
  .get(
    "/me",
    async ({ headers, set }) => {
      const session = await service.sessionFromHeaders(headers);
      if (!session) {
        set.status = 401;
        return { error: "unauthorized" };
      }
      return session;
    }
  )
  .post(
    "/pats",
    async ({ body, headers, set }) => {
      const session = await service.sessionFromHeaders(headers);
      if (!session || session.role !== "admin") {
        set.status = 403;
        return { error: "forbidden" };
      }
      return service.createPat(session.sub, body.name);
    },
    { body: createPatDto }
  );
