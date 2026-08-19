import { SettingsSubNav } from "@/shared/components/SettingsSubNav";
import { AppShell } from "@/shared/layout/AppShell";
import { SchedulerAccountsTable } from "./components/SchedulerAccountsTable";
import { SchedulerJobsSection } from "./components/SchedulerJobsSection";
import { SchedulerStatusHeader } from "./components/SchedulerStatusHeader";
import { useSchedulerStatus } from "./services/scheduler.service";

export function SettingsSchedulerPage() {
  const { data: status, isPending, isError } = useSchedulerStatus();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-volt-text">Scheduler</h1>
          <p className="mt-1 text-sm text-volt-text-3">
            Hourly ad account sync health, per-account job history, and recent failures.
          </p>
        </div>
        <SettingsSubNav />
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading scheduler status…</p>
        ) : isError || !status ? (
          <p className="text-sm text-volt-down">Failed to load scheduler status.</p>
        ) : (
          <>
            <SchedulerStatusHeader status={status} />
            {status.accounts.length > 0 ? (
              <SchedulerAccountsTable accounts={status.accounts} />
            ) : (
              <p className="text-sm text-volt-text-3">No ad accounts are connected yet.</p>
            )}
            <SchedulerJobsSection accounts={status.accounts} />
          </>
        )}
      </div>
    </AppShell>
  );
}
