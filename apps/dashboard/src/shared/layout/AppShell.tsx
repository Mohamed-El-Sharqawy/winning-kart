import { Link, useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { useLogout } from "@/shared/services/session.service";
import { useBellCount } from "@/shared/services/bell.service";
import { Button } from "@/shared/components/Button";
import { NAV_GROUPS } from "@/shared/data/roles.data";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useWorkspaceClient } from "@/shared/lib/workspace-client";
import type { WorkspaceTab } from "@/routes/router";

const ITEM_PATHS = {
  Overview: "/overview",
  "Alerts & Tasks": "/alerts",
  Clients: "/clients",
  "Team & Permissions": "/team",
  Settings: "/settings/tokens",
} as const;

const WORKSPACE_TABS: Record<string, WorkspaceTab> = {
  "Ad Accounts": "ad-accounts",
  Campaigns: "campaigns",
  "Ad Sets": "ad-sets",
  "Ads & Creatives": "creatives",
  "Attribution & Revenue": "revenue",
};

const NAV_BASE_CLASS = "rounded-[10px] px-3 py-1.5 text-sm transition-colors";
const NAV_ACTIVE_CLASS = "bg-volt-primary/15 font-medium text-volt-primary-strong";
const NAV_IDLE_CLASS = "text-volt-text-2 hover:bg-volt-surface-2 hover:text-volt-text";

function TopbarBell() {
  const bell = useBellCount();
  const count = bell.data ?? 0;

  return (
    <Link
      to="/alerts"
      search={{ tab: "alerts" }}
      className="inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1 text-sm text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text"
    >
      Alerts
      {count > 0 ? (
        <span className="rounded-full bg-volt-down px-1.5 font-mono text-[11px] tabular-nums text-volt-ground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { displayName, role } = usePermissions();
  const logout = useLogout();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const roleLabel = role === "client" ? "Client" : "Agency admin";

  return (
    <div className="flex min-h-screen bg-volt-ground">
      <Sidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-volt-border bg-volt-surface px-6 py-3">
          <TopbarBell />
          <span className="text-sm text-volt-text">{displayName ?? "Signed in"}</span>
          <span className="rounded-full border border-volt-border-2 bg-volt-surface-2 px-2 py-0.5 text-xs text-volt-text-2">
            {roleLabel}
          </span>
          <Button
            variant="ghost"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, { onSuccess: () => void navigate({ to: "/auth" }) })
            }
          >
            Sign out
          </Button>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <nav className="w-60 shrink-0 border-r border-volt-border bg-volt-surface p-4">
      <p className="px-2 pb-6 pt-2 text-sm font-bold tracking-[0.2em] text-volt-primary-strong">
        WINNING KART
      </p>
      <div className="flex flex-col gap-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-volt-text-3">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavItem key={item} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

function navLinkClass(active: boolean): string {
  return cn(NAV_BASE_CLASS, active ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS);
}

function NavItem({ item, pathname }: { item: string; pathname: string }) {
  const workspaceClient = useWorkspaceClient();
  const search = useSearch({ strict: false }) as { tab?: string };
  const path = (ITEM_PATHS as Record<string, string | undefined>)[item];
  const tab = WORKSPACE_TABS[item];

  if (path !== undefined) {
    const active = pathname === path || pathname.startsWith(`${path}/`);
    return (
      <Link
        to={path as "/overview"}
        search={path === "/alerts" ? { tab: "alerts" } : undefined}
        className={navLinkClass(active)}
      >
        {item}
      </Link>
    );
  }

  if (tab !== undefined) {
    if (workspaceClient === null) {
      return (
        <Link to="/clients" title="Pick a client first" className={navLinkClass(false)}>
          {item}
        </Link>
      );
    }
    const active = pathname.startsWith("/clients/") && search.tab === tab;
    return (
      <Link
        to="/clients/$slug"
        params={{ slug: workspaceClient.slug }}
        search={{ tab }}
        className={navLinkClass(active)}
      >
        {item}
      </Link>
    );
  }

  return (
    <span
      title="Ships in V1"
      className={cn(NAV_BASE_CLASS, "cursor-default text-volt-text-3/60")}
    >
      {item}
    </span>
  );
}
