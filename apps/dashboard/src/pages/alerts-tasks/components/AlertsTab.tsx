import { useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusDot } from "@/shared/components/StatusDot";
import { useAlerts } from "../services/alerts.service";
import type { AlertListStatus, AlertSeverity } from "../types/alerts.types";
import { AlertCard } from "./AlertCard";
import { Select } from "./Select";
import { SkeletonRows } from "./SkeletonRows";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
  { value: "snoozed", label: "Snoozed" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "suppressed", label: "Suppressed" },
  { value: "dismissed", label: "Dismissed" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export function AlertsTab() {
  const [status, setStatus] = useState<AlertListStatus>("open");
  const [severity, setSeverity] = useState("all");
  const { data: alerts, isPending, isError } = useAlerts({
    status,
    severity: severity === "all" ? undefined : (severity as AlertSeverity),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(value) => setStatus(value as AlertListStatus)}
        />
        <Select label="Severity" value={severity} options={SEVERITY_OPTIONS} onChange={setSeverity} />
      </div>
      {isPending ? (
        <SkeletonRows rows={4} columns={4} />
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load alerts.</p>
      ) : (alerts ?? []).length === 0 ? (
        <EmptyState
          title="All clear"
          hint="No alerts in the last 72 hours"
          action={<StatusDot variant="up" />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(alerts ?? []).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
