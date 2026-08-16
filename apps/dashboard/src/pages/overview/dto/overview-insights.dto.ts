export type OverviewInsightSeverityDto = "critical" | "warning" | "info";

export interface OverviewInsightDto {
  id: string;
  severity: OverviewInsightSeverityDto;
  headline: string;
  entityName: string;
  ctaTarget: string | null;
}
