export interface AdSet {
  id: string;
  campaignId: string;
  campaignName: string;
  platformAdsetId: string;
  name: string;
  status: string;
  optimizationGoal: string;
  bidStrategy: string;
  dailyBudget: number | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  frequency: number | null;
  reach: number | null;
}
