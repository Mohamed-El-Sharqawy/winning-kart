import type { AdAccountDto, CampaignDto, SyncResponseDto } from "../dto/ad-accounts.dto";
import type { AdAccount, Campaign, SyncResult, SyncStageResult } from "../types/ad-accounts.types";

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

export function toAdAccount(dto: AdAccountDto): AdAccount {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    adAccountId: dto.adAccountId,
    platform: dto.platform,
    healthState: dto.healthState,
    currency: dto.currency,
    timezone: dto.timezone,
    lastSyncAt: toDate(dto.lastSyncAt),
    campaignCount: dto.campaignCount ?? 0,
  };
}

export function toAdAccounts(dtos: AdAccountDto[]): AdAccount[] {
  return dtos.map(toAdAccount);
}

export function toCampaign(dto: CampaignDto): Campaign {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    objective: dto.objective,
    dailyBudget: dto.dailyBudget ?? null,
    currency: dto.currency,
    spend: dto.spend ?? null,
    revenue: dto.revenue ?? null,
    purchases: dto.purchases ?? null,
    roas: dto.roas ?? null,
    cpa: dto.cpa ?? null,
    ctr: dto.ctr ?? null,
    frequency: dto.frequency ?? null,
  };
}

export function toCampaigns(dtos: CampaignDto[]): Campaign[] {
  return dtos.map(toCampaign);
}

export function toSyncResult(dto: SyncResponseDto | null | undefined): SyncResult {
  const stages: SyncStageResult[] = (dto?.stages ?? []).map((stage) => ({
    stage: stage.stage,
    status: stage.status,
    errorClass: stage.errorClass ?? undefined,
  }));
  return {
    ok: dto?.ok ?? false,
    stages,
    failedStage: dto?.failedStage ?? undefined,
    errorClass: dto?.errorClass ?? undefined,
  };
}
