import {
  createRoute,
  createRootRoute,
  createRouter,
  Outlet,
  redirect,
  type RouteComponent,
} from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { AlertsTasksPage } from "@/pages/alerts-tasks";
import { AttributionDocsPage } from "@/pages/attribution-docs";
import { AuthPage } from "@/pages/auth";
import { CampaignDetailPage } from "@/pages/campaign-detail";
import { ClientWorkspacePage } from "@/pages/client-workspace";
import { ClientsPage } from "@/pages/clients";
import { IntegrationDocsPage } from "@/pages/integration-docs";
import { OverviewPage } from "@/pages/overview";
import { PortalPage } from "@/pages/portal";
import { SettingsAuditPage } from "@/pages/settings-audit";
import { SettingsDataPage } from "@/pages/settings-data";
import { SettingsSchedulerPage } from "@/pages/settings-scheduler";
import { TeamPage } from "@/pages/team";
import { TokensPage } from "@/pages/tokens";
import { sessionQueryOptions } from "@/shared/services/session.service";
import { RouteError } from "@/shared/components/RouteError";
import { requireAdmin, requireClient, requireWorkspaceAccess } from "./guards";
import type { AlertsSearch, CampaignDetailSearch, ClientWorkspaceSearch } from "./search";
import { isAlertsTab, readDays, readIsoDate, readOptionalNumber, readOptionalString, readTab } from "./search";

export type {
  AlertsTab,
  AlertsSearch,
  CampaignDetailSearch,
  ClientWorkspaceSearch,
  WorkspaceTab,
} from "./search";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  errorComponent: RouteError,
});

function adminRoute<TPath extends string>(path: TPath, component: RouteComponent) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: requireAdmin,
    component,
  });
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
    const session = await queryClient.fetchQuery(sessionQueryOptions());
    if (!session) throw redirect({ to: "/auth" });
    throw redirect({ to: session.role === "admin" ? "/overview" : "/portal" });
  },
});

const overviewRoute = adminRoute("/overview", OverviewPage);

const clientsRoute = adminRoute("/clients", ClientsPage);

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
  beforeLoad: async ({ params, search }) => {
    await requireWorkspaceAccess(params, search.tab);
  },
  validateSearch: (search: Record<string, unknown>): ClientWorkspaceSearch => ({
    tab: readTab(search.tab),
    days: readOptionalNumber(search.days),
    from: readIsoDate(search.from),
    to: readIsoDate(search.to),
    account: readOptionalString(search.account),
    accountName: readOptionalString(search.accountName),
    campaign: readOptionalString(search.campaign),
    campaignName: readOptionalString(search.campaignName),
    adSet: readOptionalString(search.adSet),
    adSetName: readOptionalString(search.adSetName),
    variant: readOptionalString(search.variant),
    creative: readOptionalString(search.creative),
  }),
  component: ClientWorkspacePage,
});

const campaignDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$slug/campaigns/$campaignId",
  beforeLoad: async ({ params }) => {
    await requireWorkspaceAccess(params, "campaigns");
  },
  validateSearch: (search: Record<string, unknown>): CampaignDetailSearch => ({
    days: readDays(search.days),
    from: readIsoDate(search.from),
    to: readIsoDate(search.to),
    account: readOptionalString(search.account),
    accountName: readOptionalString(search.accountName),
    creative: readOptionalString(search.creative),
  }),
  component: CampaignDetailPage,
});

const tokensRoute = adminRoute("/settings/tokens", TokensPage);

const settingsAuditRoute = adminRoute("/settings/audit", SettingsAuditPage);
const settingsDataRoute = adminRoute("/settings/data", SettingsDataPage);
const settingsSchedulerRoute = adminRoute("/settings/scheduler", SettingsSchedulerPage);
const teamRoute = adminRoute("/team", TeamPage);
const integrationDocsRoute = adminRoute("/docs/integrations", IntegrationDocsPage);
const attributionDocsRoute = adminRoute("/docs/attribution", AttributionDocsPage);

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
  integrationDocsRoute,
  attributionDocsRoute,
  portalRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
