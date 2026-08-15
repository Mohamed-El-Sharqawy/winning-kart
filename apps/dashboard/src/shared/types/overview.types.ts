export interface OverviewIssue {
  adAccountId: string;
  name: string;
  healthState: string;
  lastSyncAt: Date | null;
  errorHint: string | null;
}

export interface OverviewClientRow {
  id: string;
  name: string;
  slug: string;
  spend: number | null;
  revenue: number | null;
  roas: number | null;
}

export interface Overview {
  spend: number | null;
  revenue: number | null;
  roas: number | null;
  cpa: number | null;
  purchases: number | null;
  accountsHealthy: number;
  accountsTotal: number;
  issues: OverviewIssue[];
  clients: OverviewClientRow[];
}
