import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

const SETTINGS_PAGES = [
  { label: "Scheduler", to: "/settings/scheduler" },
  { label: "Token scopes and keys", to: "/settings/tokens" },
  { label: "Audit log", to: "/settings/audit" },
  { label: "Data & retention", to: "/settings/data" },
] as const;

export function SettingsSubNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Settings"
      className="flex flex-wrap items-center gap-1 rounded-[10px] border border-volt-border bg-volt-surface p-1.5"
    >
      {SETTINGS_PAGES.map((page) => (
        <Link
          key={page.to}
          to={page.to}
          className={cn(
            "rounded-[8px] px-3 py-1.5 text-sm transition-colors",
            page.to === current
              ? "bg-volt-primary/15 font-medium text-volt-primary-strong"
              : "text-volt-text-2 hover:bg-volt-surface-2 hover:text-volt-text",
          )}
        >
          {page.label}
        </Link>
      ))}
    </nav>
  );
}
