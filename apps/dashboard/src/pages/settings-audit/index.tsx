import { useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { Input } from "@/shared/components/Input";
import { SettingsSubNav } from "@/shared/components/SettingsSubNav";
import { AppShell } from "@/shared/layout/AppShell";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { AuditLogsTable } from "./components/AuditLogsTable";
import { useAuditLogs } from "./services/audit-logs.service";
import type { AuditOutcomeFilter } from "./types/audit-logs.types";

const DAY_OPTIONS = [7, 30, 90];

const SELECT_CLASS =
  "rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

const EXPORT_CLASS =
  "inline-flex cursor-pointer items-center rounded-[10px] border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text";

export function SettingsAuditPage() {
  const [actionInput, setActionInput] = useState("");
  const action = useDebounce(actionInput.trim());
  const [outcome, setOutcome] = useState<AuditOutcomeFilter>("");
  const [days, setDays] = useState(30);
  const { data: logs, isPending, isError } = useAuditLogs({ action, outcome, days });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-volt-text">Audit log</h1>
          <p className="mt-1 text-sm text-volt-text-3">
            Every privileged action taken in Winning Kart, newest first.
          </p>
        </div>
        <SettingsSubNav />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Input
              label="Action"
              placeholder="e.g. client.update"
              value={actionInput}
              onChange={(event) => setActionInput(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
            Outcome
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as AuditOutcomeFilter)}
              className={SELECT_CLASS}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
            Window
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className={SELECT_CLASS}
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
          </label>
          <a href={`/api/audit-logs/export?days=${days}`} download className={EXPORT_CLASS}>
            Export CSV
          </a>
        </div>
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading audit log…</p>
        ) : isError ? (
          <p className="text-sm text-volt-down">Failed to load audit log.</p>
        ) : logs && logs.length > 0 ? (
          <AuditLogsTable logs={logs} />
        ) : (
          <EmptyState title="No audit entries" hint="No actions match these filters." />
        )}
      </div>
    </AppShell>
  );
}
