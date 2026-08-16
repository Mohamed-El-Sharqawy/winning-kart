import type { Severity } from "./rules";

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 1,
  warning: 0.5,
  info: 0.1,
};

export function priorityScore(severity: Severity, affectedSpend7d: number): number {
  return Math.round(affectedSpend7d * SEVERITY_WEIGHTS[severity] * 100) / 100;
}
