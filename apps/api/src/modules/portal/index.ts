import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { portalOverviewDto, portalOverviewQueryDto } from "../../dto/portal";
import { PortalModel } from "./model";
import { PortalService } from "./service";
import type { PortalClientRow } from "./model";

const model = new PortalModel();
const service = new PortalService(model);

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

function parseDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_DAYS), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_DAYS;
  }
  return Math.min(Math.max(parsed, 1), MAX_DAYS);
}

async function resolvePortalClient(
  headers: Record<string, string | undefined>
): Promise<PortalClientRow> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  if (user.role !== "client") {
    throw problem(403, "FORBIDDEN", "Portal is for client users");
  }
  const assignedClientId = await model.findAssignedClientId(user.id);
  const client =
    assignedClientId !== null
      ? ((await model.findClientById(assignedClientId)) ??
        (await model.findClientByPrimaryContact(user.id)))
      : await model.findClientByPrimaryContact(user.id);
  if (!client) {
    throw problem(403, "NO_CLIENT_ASSIGNMENT", "No client is assigned to this user");
  }
  return client;
}

export const portalModule = new Elysia({ prefix: "/portal" }).get(
  "/overview",
  async ({ headers, query }) => {
    const client = await resolvePortalClient(headers);
    return { data: await service.overview(client, parseDays(query.days)) };
  },
  { query: portalOverviewQueryDto, response: { 200: portalOverviewDto } }
);
