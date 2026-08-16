export type OverviewInsightSeverity = "critical" | "warning" | "info";

export interface OverviewInsight {
  id: string;
  severity: OverviewInsightSeverity;
  headline: string;
  entityName: string;
  ctaTarget: string | null;
}
