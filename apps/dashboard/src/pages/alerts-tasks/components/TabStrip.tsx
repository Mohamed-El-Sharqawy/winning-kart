import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import type { AlertsTab } from "@/routes/router";

const TABS: Array<{ id: AlertsTab; label: string }> = [
  { id: "alerts", label: "Alerts" },
  { id: "tasks", label: "Tasks" },
  { id: "recommendations", label: "Recommendations" },
];

export function TabStrip({ tab }: { tab: AlertsTab }) {
  return (
    <nav className="flex gap-6 border-b border-volt-border" aria-label="Alerts and tasks sections">
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          to="/alerts"
          search={{ tab: id }}
          aria-current={id === tab ? "page" : undefined}
          className={cn(
            "-mb-px border-b pb-3 pt-1 text-sm transition-colors",
            id === tab
              ? "border-volt-primary font-medium text-volt-text"
              : "border-transparent text-volt-text-3 hover:text-volt-text",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
