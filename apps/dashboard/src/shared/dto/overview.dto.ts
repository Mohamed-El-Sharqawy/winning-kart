export interface OverviewIssueDto {
  adAccountId: string;
  name: string;
  healthState: string;
  lastSyncAt: string | null;
  errorHint: string | null;
}

export interface OverviewClientRowDto {
  id: string;
  name: string;
  slug: string;
  spend: number | null;
  revenue: number | null;
  roas: number | null;
}

export interface OverviewDto {
  spend: number | null;
  revenue: number | null;
  roas: number | null;
  cpa: number | null;
  purchases: number | null;
  accountsHealthy: number | null;
  accountsTotal: number | null;
  issues: OverviewIssueDto[] | null;
  clients: OverviewClientRowDto[] | null;
}
