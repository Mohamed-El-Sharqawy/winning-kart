import { Link, useSearch } from "@tanstack/react-router";
import { CLIENT_NAV_GROUPS, CLIENT_TABS } from "@/shared/data/roles.data";
import { navLinkClass } from "@/shared/layout/nav-link-class";
import { usePortalClient } from "@/shared/services/portal-client.service";
import type { WorkspaceTab } from "@/routes/router";

function clientTab(item: string): WorkspaceTab | undefined {
  return (CLIENT_TABS as Record<string, WorkspaceTab | undefined>)[item];
}

function ClientWorkspaceNavItem({ item, pathname }: { item: string; pathname: string }) {
  const search = useSearch({ strict: false }) as { tab?: string };
  const tab = clientTab(item);
  const portalClient = usePortalClient();

  if (tab === undefined) return null;
  if (portalClient.isPending) {
    return (
      <span title="Loading your business…" className={navLinkClass(false)}>
        {item}
      </span>
    );
  }
  if (portalClient.data === undefined) {
    return (
      <Link to="/portal" title="Your business is being set up" className={navLinkClass(false)}>
        {item}
      </Link>
    );
  }

  const active = pathname.startsWith("/clients/") && search.tab === tab;
  return (
    <Link
      to="/clients/$slug"
      params={{ slug: portalClient.data.slug }}
      search={{ tab }}
      className={navLinkClass(active)}
    >
      {item}
    </Link>
  );
}

function ClientNavItem({ item, pathname }: { item: string; pathname: string }) {
  if (clientTab(item) === undefined) {
    const active = pathname === "/portal";
    return (
      <Link to="/portal" className={navLinkClass(active)}>
        {item}
      </Link>
    );
  }
  return <ClientWorkspaceNavItem item={item} pathname={pathname} />;
}

export function ClientNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col gap-6">
      {CLIENT_NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-volt-text-3">
            {group.label}
          </p>
          {group.items.map((item) => (
            <ClientNavItem key={item} item={item} pathname={pathname} />
          ))}
        </div>
      ))}
    </div>
  );
}
