import { cn } from "@/lib/cn";

export type StatusDotVariant = "up" | "down" | "neutral" | "warning";

const DOT_CLASSES: Record<StatusDotVariant, string> = {
  up: "bg-volt-up shadow-[0_0_0_3px_var(--color-volt-up-tint)]",
  down: "bg-volt-down shadow-[0_0_0_3px_var(--color-volt-down-tint)]",
  neutral: "bg-volt-text-3 shadow-[0_0_0_3px_var(--color-volt-surface-2)]",
  warning: "bg-volt-primary shadow-[0_0_0_3px_rgb(139_92_246_/_0.22)]",
};

const WORD_CLASSES: Record<StatusDotVariant, string> = {
  up: "text-volt-up",
  down: "text-volt-down",
  neutral: "text-volt-text-3",
  warning: "text-volt-primary-strong",
};

export interface StatusDotProps {
  variant?: StatusDotVariant;
  children?: React.ReactNode;
  className?: string;
}

export function StatusDot({ variant = "neutral", children, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className={cn("h-1.75 w-1.75 shrink-0 rounded-full", DOT_CLASSES[variant])} />
      {children !== undefined ? <span className={WORD_CLASSES[variant]}>{children}</span> : null}
    </span>
  );
}

const UP_STATES = ["healthy", "ok", "fresh", "connected", "active"];
const DOWN_STATES = ["error", "failed", "expired", "invalid", "disconnected", "token_invalid"];
const WARNING_STATES = ["warning", "degraded", "needs_attention", "stale", "syncing", "pending"];

export function healthDotVariant(healthState: string): StatusDotVariant {
  const state = healthState.toLowerCase();
  if (UP_STATES.includes(state)) return "up";
  if (DOWN_STATES.includes(state)) return "down";
  if (WARNING_STATES.includes(state)) return "warning";
  return "neutral";
}

const ENTITY_STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  campaign_paused: "neutral",
  adset_paused: "neutral",
  pending_review: "warning",
  preapproved: "warning",
  pending_billing_info: "warning",
  in_process: "warning",
  disapproved: "down",
  with_issues: "down",
  unknown: "neutral",
};

export function entityStatusVariant(status: string | null | undefined): StatusDotVariant {
  if (status === null || status === undefined) return "neutral";
  return ENTITY_STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

export function statusWords(value: string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLowerCase().replace(/_/g, " ");
}
