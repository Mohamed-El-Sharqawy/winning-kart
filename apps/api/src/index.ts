import { Elysia } from "elysia";
import { authModule } from "./modules/auth";
import { userModule } from "./modules/user";
import { clientsModule } from "./modules/clients";
import { adAccountsModule } from "./modules/ad-accounts";
import { overviewModule } from "./modules/overview";
import { startSyncCron } from "./lib/sync-cron";

const api = new Elysia({ prefix: "/api" })
  .use(authModule)
  .use(userModule)
  .use(clientsModule)
  .use(adAccountsModule)
  .use(overviewModule);

const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .use(api)
  .listen(Number(process.env.PORT ?? 3000));

if (process.env.NODE_ENV !== "test") {
  startSyncCron();
}

console.log(`winning-kart api listening on :${process.env.PORT ?? 3000}`);

export type App = typeof app;
