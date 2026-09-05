import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { mcpRequestDto } from "../../dto/mcp";
import { ClientsModel } from "../clients/model";
import { AdAccountsModel } from "../ad-accounts/model";
import { AdAccountsService } from "../ad-accounts/service";
import { OverviewModel } from "../overview/model";
import { OverviewService } from "../overview/service";
import { PortalModel } from "../portal/model";
import { AlertsModel } from "../alerts/model";
import { TasksModel } from "../tasks/model";
import { TasksService } from "../tasks/service";
import { McpService } from "./service";
import { listAdsPage } from "../performance/ads-list";
import { adsListDeps } from "../performance/ads-deps";
import type { McpModels } from "./tools";

const models: McpModels = {
  clients: new ClientsModel(),
  adAccounts: new AdAccountsService(new AdAccountsModel()),
  overview: new OverviewService(new OverviewModel()),
  portal: new PortalModel(),
  alerts: new AlertsModel(),
  tasks: new TasksService(new TasksModel()),
  adsList: (accountId, query) => listAdsPage(adsListDeps(accountId), accountId, query),
};

const service = new McpService();

export const mcpModule = new Elysia({ prefix: "/mcp" }).post(
  "/",
  async ({ body, headers }) => {
    const user = await resolveSessionUser({ cookie: headers.cookie, headers });
    if (!user) {
      throw problem(401, "UNAUTHENTICATED", "Authentication required");
    }
    return { data: await service.handle(body, { user, models }) };
  },
  { body: mcpRequestDto }
);
