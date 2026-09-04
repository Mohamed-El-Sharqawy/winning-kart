import { useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { useSchedulerJobs } from "../services/scheduler.service";
import type { SchedulerAccount, SchedulerJobFilters } from "../types/scheduler.types";
import { SchedulerJobsTable } from "./SchedulerJobsTable";

const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

const HOUR_OPTIONS = [24, 72, 168];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "running", label: "Running" },
];

export function SchedulerJobsSection({ accounts }: { accounts: SchedulerAccount[] }) {
  const [filters, setFilters] = useState<SchedulerJobFilters>({ adAccountId: "", status: "", hours: 24 });
  const { data: jobs, isPending, isError } = useSchedulerJobs(filters);

  function patch(partial: Partial<SchedulerJobFilters>) {
    setFilters((current) => ({ ...current, ...partial }));
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-volt-text">Sync jobs</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Account
          <select
            value={filters.adAccountId}
            onChange={(event) => patch({ adAccountId: event.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.adAccountId} value={account.adAccountId}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Status
          <select
            value={filters.status}
            onChange={(event) => patch({ status: event.target.value })}
            className={SELECT_CLASS}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Window
          <select
            value={filters.hours}
            onChange={(event) => patch({ hours: Number(event.target.value) })}
            className={SELECT_CLASS}
          >
            {HOUR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Last {option}h
              </option>
            ))}
          </select>
        </label>
      </div>
      {isPending ? (
        <p className="text-sm text-volt-text-3">Loading sync jobs…</p>
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load sync jobs.</p>
      ) : jobs && jobs.length > 0 ? (
        <SchedulerJobsTable jobs={jobs} />
      ) : (
        <EmptyState title="No sync jobs" hint="No jobs match these filters in the selected window." />
      )}
    </section>
  );
}
