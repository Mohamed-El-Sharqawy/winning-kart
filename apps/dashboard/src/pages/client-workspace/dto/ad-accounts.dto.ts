export interface AdAccountDto {
  id: string;
  name: string;
  slug: string;
  adAccountId: string;
  platform: string;
  healthState: string;
  currency: string;
  timezone: string;
  lastSyncAt: string | null;
  campaignCount: number | null;
}

export interface CampaignDto {
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

export interface SyncStageDto {
  stage: string;
  status: "running" | "succeeded" | "failed";
  errorClass?: string;
}

export interface SyncResponseDto {
  ok: boolean;
  stages: SyncStageDto[] | null;
  summary?: Record<string, number>;
  failedStage?: string;
  errorClass?: string;
}

export interface OkResponseDto {
  ok: boolean;
}
