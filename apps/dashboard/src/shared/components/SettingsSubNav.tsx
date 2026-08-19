import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

const SETTINGS_PAGES = [
  { label: "Keys & tokens", to: "/settings/tokens" },
  { label: "Audit log", to: "/settings/audit" },
  { label: "Data & retention", to: "/settings/data" },
  { label: "Scheduler", to: "/settings/scheduler" },
] as const;

export function SettingsSubNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Settings" className="flex items-center gap-6 border-b border-volt-border">
      {SETTINGS_PAGES.map((page) => {
        const active = pathname === page.to || pathname.startsWith(`${page.to}/`);
        return (
          <Link
            key={page.to}
            to={page.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 py-2 text-sm transition-colors",
              active
                ? "border-volt-primary font-medium text-volt-text"
                : "border-transparent text-volt-text-3 hover:text-volt-text",
            )}
          >
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}
