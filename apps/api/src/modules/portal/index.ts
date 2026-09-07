import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { portalClientDto, portalOverviewDto, portalOverviewQueryDto } from "../../dto/portal";
import { ClientOwnershipModel } from "./client-ownership";
import type { PortalClientRow } from "./client-ownership";
import { PortalModel } from "./model";
import { PortalService } from "./service";

const ownership = new ClientOwnershipModel();
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

async function resolveSession(headers: Record<string, string | undefined>) {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

async function resolvePortalClient(
  headers: Record<string, string | undefined>
): Promise<PortalClientRow> {
  const user = await resolveSession(headers);
  if (user.role !== "client") {
    throw problem(403, "FORBIDDEN", "Portal is for client users");
  }
  const client = await ownership.findAssignedClient(user.id);
  if (!client) {
    throw problem(403, "NO_CLIENT_ASSIGNMENT", "No client is assigned to this user");
  }
  return client;
}

function toClientPayload(client: PortalClientRow) {
  return {
    id: client.id,
    name: client.name,
    slug: client.slug,
    status: client.status,
    industry: client.industry,
    displayCurrency: client.displayCurrency,
    createdAt: client.createdAt.toISOString(),
  };
}

export const portalModule = new Elysia({ prefix: "/portal" })
  .get(
    "/overview",
    async ({ headers, query }) => {
      const client = await resolvePortalClient(headers);
      return { data: await service.overview(client, parseDays(query.days)) };
    },
    { query: portalOverviewQueryDto, response: { 200: portalOverviewDto } }
  )
  .get(
    "/client",
    async ({ headers }) => {
      const client = await resolvePortalClient(headers);
      return { data: toClientPayload(client) };
    },
    { response: { 200: portalClientDto } }
  );
