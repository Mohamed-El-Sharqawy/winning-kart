export interface KpiSummaryDto {
  spend: number;
  revenue: number;
  purchases: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}
