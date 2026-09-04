import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import type { WorkspaceTab } from "@/routes/router";

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "ad-accounts", label: "Ad Accounts" },
  { id: "campaigns", label: "Campaigns" },
  { id: "ad-sets", label: "Ad Sets" },
  { id: "creatives", label: "Creatives" },
  { id: "revenue", label: "Revenue" },
];

export function WorkspaceTabs({ slug, tab }: { slug: string; tab: WorkspaceTab }) {
  return (
    <nav className="flex gap-6 border-b border-volt-border" aria-label="Client workspace sections">
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          to="/clients/$slug"
          params={{ slug }}
          search={(prev) => ({ ...prev, tab: id })}
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
