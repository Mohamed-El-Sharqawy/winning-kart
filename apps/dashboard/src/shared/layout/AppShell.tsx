import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useLogout } from "@/shared/services/session.service";
import { useBellCount } from "@/shared/services/bell.service";
import { Button } from "@/shared/components/Button";
import { Sidebar } from "@/shared/layout/Sidebar";
import { usePermissions } from "@/shared/hooks/usePermissions";

function TopbarBell() {
  const bell = useBellCount();
  const count = bell.data ?? 0;

  return (
    <Link
      to="/alerts"
      search={{ tab: "alerts" }}
      className="inline-flex items-center gap-1.5 rounded-wk px-2 py-1 text-sm text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text"
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
