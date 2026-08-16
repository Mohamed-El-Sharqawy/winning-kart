export type SyncStageStatus = "running" | "succeeded" | "failed";

export interface SyncStageResult {
  stage: string;
  status: SyncStageStatus;
  errorClass?: string;
}

export interface SyncResult {
  ok: boolean;
  stages: SyncStageResult[];
  failedStage?: string;
  errorClass?: string;
}

export type TokenType = "system_user" | "user_60d";

export interface AdAccount {
  id: string;
  name: string;
  slug: string;
  adAccountId: string;
  platform: string;
  healthState: string;
  currency: string;
  timezone: string;
  lastSyncAt: Date | null;
  campaignCount: number;
  tokenType: TokenType;
  tokenExpiresAt: Date | null;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number | null;
  currency: string;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
}
