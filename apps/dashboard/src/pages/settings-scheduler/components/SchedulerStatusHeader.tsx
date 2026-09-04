import { StatusDot } from "@/shared/components/StatusDot";
import type { SchedulerStatus } from "../types/scheduler.types";

export function SchedulerStatusHeader({ status }: { status: SchedulerStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-wk border border-volt-border bg-volt-surface px-5 py-4">
      {status.enabled ? (
        <StatusDot variant="up">Hourly sync</StatusDot>
      ) : (
        <div className="flex flex-col gap-1">
          <StatusDot variant="warning">Sync paused</StatusDot>
          <p className="text-[13px] text-volt-text-3">
            WK_SYNC_CRON=off is set on the api — remove the variable to re-enable the hourly sync.
          </p>
        </div>
      )}
      <span className="text-[13px] text-volt-text-3">
        <span className="tabular font-mono">{status.accounts.length}</span> ad account
        {status.accounts.length === 1 ? "" : "s"} on the schedule
      </span>
    </div>
  );
}
