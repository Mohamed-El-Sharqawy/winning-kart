import { cn } from "@/lib/cn";
import type { AlertSeverity } from "../types/alerts.types";

const DOT_CLASSES: Record<AlertSeverity, string> = {
  critical: "bg-volt-down shadow-[0_0_0_3px_var(--color-volt-down-tint)]",
  warning: "bg-volt-primary-strong shadow-[0_0_0_3px_rgb(139_92_246_/_0.10)]",
  info: "bg-volt-text-3 shadow-[0_0_0_3px_var(--color-volt-surface-2)]",
};

const WORD_CLASSES: Record<AlertSeverity, string> = {
  critical: "text-volt-down",
  warning: "text-volt-primary-strong",
  info: "text-volt-text-3",
};

const LABELS: Record<AlertSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function SeverityChip({ severity, className }: { severity: AlertSeverity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className={cn("h-[7px] w-[7px] shrink-0 rounded-full", DOT_CLASSES[severity])} />
      <span className={cn("text-xs font-medium", WORD_CLASSES[severity])}>{LABELS[severity]}</span>
    </span>
  );
}
