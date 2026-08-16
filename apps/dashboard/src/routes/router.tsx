import {
  createRoute,
  createRootRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { AuthPage } from "@/pages/auth";
import { ClientWorkspacePage } from "@/pages/client-workspace";
import { ClientsPage } from "@/pages/clients";
import { OverviewPage } from "@/pages/overview";
import { PortalPage } from "@/pages/portal";
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

export type WorkspaceTab = "overview" | "ad-accounts" | "campaigns";

function readTab(value: unknown): WorkspaceTab {
  return value === "ad-accounts" || value === "campaigns" ? value : "overview";
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

const clientWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$slug",
  beforeLoad: requireAdmin,
  validateSearch: (search: Record<string, unknown>): { tab: WorkspaceTab } => ({
    tab: readTab(search.tab),
  }),
  component: ClientWorkspacePage,
});

const tokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/tokens",
  beforeLoad: requireAdmin,
  component: TokensPage,
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
  clientWorkspaceRoute,
  tokensRoute,
  portalRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
