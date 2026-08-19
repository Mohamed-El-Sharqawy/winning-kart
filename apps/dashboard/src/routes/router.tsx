import {
  createRoute,
  createRootRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { AlertsTasksPage } from "@/pages/alerts-tasks";
import { AuthPage } from "@/pages/auth";
import { CampaignDetailPage } from "@/pages/campaign-detail";
import { ClientWorkspacePage } from "@/pages/client-workspace";
import { ClientsPage } from "@/pages/clients";
import { OverviewPage } from "@/pages/overview";
import { PortalPage } from "@/pages/portal";
import { SettingsAuditPage } from "@/pages/settings-audit";
import { SettingsDataPage } from "@/pages/settings-data";
import { SettingsSchedulerPage } from "@/pages/settings-scheduler";
import { TeamPage } from "@/pages/team";
import { TokensPage } from "@/pages/tokens";
import { sessionQueryOptions } from "@/shared/services/session.service";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

async function loadSession() {
  return queryClient.fetchQuery(sessionQueryOptions());
}

async function requireAdmin() {
  const session = await loadSession();
  if (!session) throw redirect({ to: "/auth" });
  if (session.role !== "admin") throw redirect({ to: "/portal" });
}

async function requireClient() {
  const session = await loadSession();
  if (!session) throw redirect({ to: "/auth" });
  if (session.role !== "client") throw redirect({ to: "/overview" });
}

export type WorkspaceTab =
  | "overview"
  | "ad-accounts"
  | "campaigns"
  | "ad-sets"
  | "creatives"
  | "revenue";

export interface ClientWorkspaceSearch {
  tab: WorkspaceTab;
  days?: number;
  account?: string;
  accountName?: string;
  adSet?: string;
  adSetName?: string;
}

export interface CampaignDetailSearch {
  days: number;
  account?: string;
  accountName?: string;
}

export type AlertsTab = "alerts" | "tasks" | "recommendations";

export interface AlertsSearch {
  tab: AlertsTab;
}

function isAlertsTab(value: unknown): value is AlertsTab {
  return value === "alerts" || value === "tasks" || value === "recommendations";
}

function isWorkspaceTab(value: unknown): value is WorkspaceTab {
  return (
    value === "overview" ||
    value === "ad-accounts" ||
    value === "campaigns" ||
    value === "ad-sets" ||
    value === "creatives" ||
    value === "revenue"
  );
}

function readTab(value: unknown): WorkspaceTab {
  return isWorkspaceTab(value) ? value : "overview";
}

function readDays(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
}

function readOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    const session = await loadSession();
    if (!session) throw redirect({ to: "/auth" });
    throw redirect({ to: session.role === "admin" ? "/overview" : "/portal" });
  },
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  beforeLoad: requireAdmin,
  component: OverviewPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients",
  beforeLoad: requireAdmin,
  component: ClientsPage,
});

const alertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/alerts",
  beforeLoad: requireAdmin,
  validateSearch: (search: Record<string, unknown>): AlertsSearch => ({
    tab: isAlertsTab(search.tab) ? search.tab : "alerts",
  }),
  component: AlertsTasksPage,
});

const clientWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$slug",
  beforeLoad: requireAdmin,
  validateSearch: (search: Record<string, unknown>): ClientWorkspaceSearch => ({
    tab: readTab(search.tab),
    days: readOptionalNumber(search.days),
    account: readOptionalString(search.account),
    accountName: readOptionalString(search.accountName),
    adSet: readOptionalString(search.adSet),
    adSetName: readOptionalString(search.adSetName),
  }),
  component: ClientWorkspacePage,
});

const campaignDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$slug/campaigns/$campaignId",
  beforeLoad: requireAdmin,
  validateSearch: (search: Record<string, unknown>): CampaignDetailSearch => ({
    days: readDays(search.days),
    account: readOptionalString(search.account),
    accountName: readOptionalString(search.accountName),
  }),
  component: CampaignDetailPage,
});

const tokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/tokens",
  beforeLoad: requireAdmin,
  component: TokensPage,
});

const settingsAuditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/audit",
  beforeLoad: requireAdmin,
  component: SettingsAuditPage,
});

const settingsDataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/data",
  beforeLoad: requireAdmin,
  component: SettingsDataPage,
});

const settingsSchedulerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/scheduler",
  beforeLoad: requireAdmin,
  component: SettingsSchedulerPage,
});

const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/team",
  beforeLoad: requireAdmin,
  component: TeamPage,
});

const portalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal",
  beforeLoad: requireClient,
  component: PortalPage,
});

const routeTree = rootRoute.addChildren([
  authRoute,
  indexRoute,
  overviewRoute,
  clientsRoute,
  alertsRoute,
  clientWorkspaceRoute,
  campaignDetailRoute,
  tokensRoute,
  settingsAuditRoute,
  settingsDataRoute,
  settingsSchedulerRoute,
  teamRoute,
  portalRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
