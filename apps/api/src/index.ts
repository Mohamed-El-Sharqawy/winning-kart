import { Elysia } from "elysia";
import { authModule } from "./modules/auth";
import { userModule } from "./modules/user";
import { clientsModule } from "./modules/clients";

const api = new Elysia({ prefix: "/api" })
  .use(authModule)
  .use(userModule)
  .use(clientsModule);

const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .use(api)
  .listen(Number(process.env.PORT ?? 3000));

console.log(`winning-kart api listening on :${process.env.PORT ?? 3000}`);

export type App = typeof app;
