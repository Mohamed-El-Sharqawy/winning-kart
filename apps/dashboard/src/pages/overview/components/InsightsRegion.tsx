import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusDot } from "@/shared/components/StatusDot";
import { useOverview } from "@/shared/services/overview.service";
import type { OverviewInsight } from "@/shared/types/overview.types";

type OverviewInsightSeverity = OverviewInsight["severity"];

const DOT_CLASSES: Record<OverviewInsightSeverity, string> = {
  critical: "bg-volt-down shadow-[0_0_0_3px_var(--color-volt-down-tint)]",
  warning: "bg-volt-primary-strong shadow-[0_0_0_3px_rgb(139_92_246_/_0.10)]",
  info: "bg-volt-text-3 shadow-[0_0_0_3px_var(--color-volt-surface-2)]",
};

const WORD_CLASSES: Record<OverviewInsightSeverity, string> = {
  critical: "text-volt-down",
  warning: "text-volt-primary-strong",
  info: "text-volt-text-3",
};

const LABELS: Record<OverviewInsightSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

function CtaLink({ target }: { target: string }) {
  if (!target.startsWith("/")) {
    return <p className="text-xs text-volt-text-3">{target}</p>;
  }
  const [path, query = ""] = target.split("?");
  const search: Record<string, string> = {};
  new URLSearchParams(query).forEach((value, key) => {
    search[key] = value;
  });
  return (
    <Link
      to={path as never}
      search={search as never}
      className="text-xs font-semibold text-volt-primary-strong hover:underline"
    >
      View details
    </Link>
  );
}

export function InsightsRegion() {
  const { data: overview, isPending, isError } = useOverview();
  const list = overview?.insights ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-volt-text-3">
          Actionable insights — top 3
        </p>
        <Link
          to="/alerts"
          search={{ tab: "recommendations" }}
          className="rounded-[10px] border border-transparent px-3 py-1.5 text-sm font-semibold text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text"
        >
          Show all
        </Link>
      </div>
      {isPending ? (
        <p className="text-sm text-volt-text-3">Loading insights…</p>
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load insights.</p>
      ) : list.length === 0 ? (
        <EmptyState title="All clear" action={<StatusDot variant="up" />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {list.map((insight) => (
            <article
              key={insight.id}
              className="flex flex-col gap-2 rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4"
            >
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("h-[7px] w-[7px] shrink-0 rounded-full", DOT_CLASSES[insight.severity])}
                />
                <span className={cn("text-xs font-medium", WORD_CLASSES[insight.severity])}>
                  {LABELS[insight.severity]}
                </span>
              </span>
              <p className="text-sm font-semibold text-volt-text">{insight.headline}</p>
              <p className="text-xs text-volt-text-3">{insight.entityName}</p>
              {insight.ctaTarget ? <CtaLink target={insight.ctaTarget} /> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
