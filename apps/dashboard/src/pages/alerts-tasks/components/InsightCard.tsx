import { useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { Button } from "@/shared/components/Button";
import { inlineErrorCopy } from "../services/api-call-error";
import { useAcceptInsight, useMarkNotUseful } from "../services/insights.service";
import type { Insight } from "../types/insights.types";
import { SeverityChip } from "./SeverityChip";
import { StatChips } from "./StatChips";

export function InsightCard({ insight }: { insight: Insight }) {
  const [error, setError] = useState<string | null>(null);
  const accept = useAcceptInsight();
  const notUseful = useMarkNotUseful();

  const onMutate = () => setError(null);
  const onError = (mutationError: unknown) => setError(inlineErrorCopy(mutationError));
  const accepted = insight.acceptedAsTaskId !== null;
  const contributors = insight.decomposition.slice(0, 3).map((entry) => ({
    label: entry.name,
    value: `${entry.pct}%`,
  }));

  return (
    <section className="flex flex-col gap-3 rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
      <div className="flex items-center gap-3">
        <SeverityChip severity={insight.severity} />
        <span className="font-mono text-xs tabular-nums text-volt-text-3">
          {formatRelativeTime(insight.detectedAt)}
        </span>
      </div>
      <p className="text-sm font-semibold text-volt-text">{insight.headline}</p>
      <p className="text-xs text-volt-text-3">
        {insight.clientName} · {insight.entityName}
      </p>
      {insight.attributionStatus === "attributed" ? (
        <p className="text-[13px] text-volt-text-2">{insight.primaryCause ?? "—"}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] text-volt-text-3">Cause: unattributed</p>
          <StatChips items={contributors} />
        </div>
      )}
      <p className="text-[13px] text-volt-text-2">
        <span className="text-volt-text-3">Recommended: </span>
        {insight.recommendedAction}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={accepted || accept.isPending}
          onClick={() => {
            onMutate();
            accept.mutate(insight.id, { onError });
          }}
        >
          {accepted ? "Accepted" : "Accept as task"}
        </Button>
        <Button
          variant="ghost"
          disabled={notUseful.isPending}
          onClick={() => {
            onMutate();
            notUseful.mutate(insight.id, { onError });
          }}
        >
          Not useful{insight.notUsefulCount > 0 ? ` · ${insight.notUsefulCount}` : null}
        </Button>
      </div>
      {error ? <p className="text-xs text-volt-down">{error}</p> : null}
    </section>
  );
}
