import { formatRelativeTime } from "@/lib/format";
import type { Alert } from "../types/alerts.types";
import { AlertActions, AlertDeleteAction } from "./AlertActions";
import { SeverityChip } from "./SeverityChip";
import { StatChips } from "./StatChips";

function formatSnoozedUntil(value: Date): string {
  return value.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertCard({ alert }: { alert: Alert }) {
  const showActions = alert.status !== "suppressed" && alert.status !== "dismissed";
  const metrics = Object.entries(alert.supportingMetrics).map(([label, value]) => ({
    label,
    value: String(value),
  }));

  return (
    <section className="flex flex-col gap-3 rounded-wk border border-volt-border bg-volt-surface px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <SeverityChip severity={alert.severity} />
          <span className="font-mono text-xs tabular-nums text-volt-text-3">
            {formatRelativeTime(alert.detectedAt)}
          </span>
        </div>
        <p className="text-sm font-semibold text-volt-text">{alert.whatHappened}</p>
        <p className="text-[13px] text-volt-text-2">{alert.whyItMatters}</p>
        <p className="text-[13px] text-volt-text-2">
          <span className="text-volt-text-3">Recommended: </span>
          {alert.recommendedAction}
        </p>
        <p className="text-xs text-volt-text-3">
          {alert.clientName} · {alert.entityName}
        </p>
      </div>
      {metrics.length > 0 ? <StatChips items={metrics} /> : null}
      {alert.status === "suppressed" ? <p className="text-xs text-volt-text-3">Suppressed — task open</p> : null}
      {alert.status === "dismissed" ? (
        <p className="text-xs text-volt-text-3">Dismissed — {alert.dismissedReason ?? "no reason given"}</p>
      ) : null}
      {alert.status === "snoozed" && alert.snoozedUntil ? (
        <p className="text-xs text-volt-text-3">Snoozed until {formatSnoozedUntil(alert.snoozedUntil)}</p>
      ) : null}
      {showActions ? <AlertActions alert={alert} /> : null}
      <AlertDeleteAction alert={alert} />
    </section>
  );
}
