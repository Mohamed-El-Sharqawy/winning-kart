import { EmptyState } from "@/shared/components/EmptyState";
import { StatusDot } from "@/shared/components/StatusDot";
import { useInsights } from "../services/insights.service";
import { InsightCard } from "./InsightCard";
import { SkeletonRows } from "./SkeletonRows";

export function RecommendationsTab() {
  const { data: insights, isPending, isError } = useInsights();
  const list = insights ?? [];

  return (
    <div className="flex flex-col gap-4">
      {isPending ? (
        <SkeletonRows rows={3} columns={4} />
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load recommendations.</p>
      ) : list.length === 0 ? (
        <EmptyState title="No recommendations right now" action={<StatusDot variant="up" />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {list.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
