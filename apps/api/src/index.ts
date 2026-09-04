import "./env";
import { Elysia } from "elysia";
import { authModule } from "./modules/auth";
import { userModule } from "./modules/user";
import { clientsModule } from "./modules/clients";
import { adAccountsModule } from "./modules/ad-accounts";
import { overviewModule } from "./modules/overview";
import { performanceModule } from "./modules/performance";
import { alertsModule } from "./modules/alerts";
import { tasksModule } from "./modules/tasks";
import { insightsModule } from "./modules/insights";
import { revenueModule } from "./modules/revenue";
import { auditModule } from "./modules/audit";
import { settingsModule } from "./modules/settings-module";
import { portalModule } from "./modules/portal";
import { mcpModule } from "./modules/mcp";
import { schedulerModule } from "./modules/scheduler";
import { startSyncCron } from "./lib/sync-cron";
import { corsPlugin } from "./lib/cors";
import { ProblemError, problemResponse, reasonPhrase } from "./lib/problem";

const api = new Elysia({ prefix: "/api" })
  .use(authModule)
  .use(userModule)
  .use(clientsModule)
  .use(adAccountsModule)
  .use(overviewModule)
  .use(performanceModule)
  .use(alertsModule)
  .use(tasksModule)
  .use(insightsModule)
  .use(revenueModule)
  .use(auditModule)
  .use(settingsModule)
  .use(portalModule)
  .use(mcpModule)
  .use(schedulerModule);

const app = new Elysia()
  .use(corsPlugin)
  .onError(({ code, error, path, set }) => {
    set.headers["content-type"] = "application/problem+json";
    if (error instanceof ProblemError) {
      set.status = error.status;
      return problemResponse(error, path);
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return problemResponse(
        {
          status: 404,
          code: "NOT_FOUND",
          title: reasonPhrase(404),
          detail: "Route not found",
        },
        path
      );
    }
    if (code === "VALIDATION") {
      set.status = 422;
      const body = problemResponse(
        {
          status: 422,
          code: "VALIDATION",
          title: reasonPhrase(422),
          detail: "Request validation failed",
        },
        path
      );
      const all = (error as unknown as { all?: unknown }).all;
      if (Array.isArray(all)) {
        body.errors = all.flatMap((entry) => {
          if (typeof entry !== "object" || entry === null) {
            return [];
          }
          const { path: entryPath, message } = entry as { path?: unknown; message?: unknown };
          return [
            {
              path: typeof entryPath === "string" ? entryPath : "",
              message: typeof message === "string" ? message : "",
            },
          ];
        });
      }
      return body;
    }
    if (code === "PARSE") {
      set.status = 400;
      return problemResponse(
        {
          status: 400,
          code: "VALIDATION",
          title: reasonPhrase(400),
          detail: "Malformed JSON body",
        },
        path
      );
    }
    set.status = 500;
    return problemResponse(
      {
        status: 500,
        code: "INTERNAL",
        title: reasonPhrase(500),
        detail:
          process.env.NODE_ENV === "production"
            ? "Unexpected server error"
            : error instanceof Error && error.message.length > 0
              ? error.message
              : "Unexpected server error",
      },
      path
    );
  })
  .get("/health", () => ({ data: { ok: true } }))
  .use(api)
  .listen(Number(process.env.PORT ?? 3000));

if (process.env.NODE_ENV !== "test") {
  startSyncCron();
}

console.log(`winning-kart api listening on :${process.env.PORT ?? 3000}`);

export type App = typeof app;
