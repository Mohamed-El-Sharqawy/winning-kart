import { formatRelativeTime } from "@/lib/format";
import { Card } from "@/shared/components/Card";
import { StatusDot, healthDotVariant } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { OverviewIssue } from "@/shared/types/overview.types";

function issueVariant(healthState: string): StatusDotVariant {
  return healthDotVariant(healthState) === "down" ? "down" : "warning";
}

export function HealthStrip({
  issues,
  accountsTotal,
}: {
  issues: OverviewIssue[];
  accountsTotal: number;
}) {
  const healthy = Math.max(0, accountsTotal - issues.length);
  return (
    <Card
      title="Account health"
      actions={
        <span className="text-xs text-volt-text-3">
          {healthy} of {accountsTotal} syncing fresh
        </span>
      }
    >
      {issues.length === 0 ? (
        <div className="flex items-center py-1">
          <StatusDot variant="up">All accounts syncing fresh</StatusDot>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-volt-border">
          {issues.map((issue) => (
            <li
              key={issue.adAccountId}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
            >
              <StatusDot variant={issueVariant(issue.healthState)}>{issue.name}</StatusDot>
              <span className="text-sm text-volt-text-3">{issue.errorHint ?? "Needs attention"}</span>
              <span className="ml-auto text-xs text-volt-text-3">
                Synced {formatRelativeTime(issue.lastSyncAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
