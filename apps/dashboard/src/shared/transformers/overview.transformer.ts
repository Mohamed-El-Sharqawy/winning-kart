import type {
  OverviewClientRowDto,
  OverviewDto,
  OverviewInsightDto,
  OverviewIssueDto,
} from "../dto/overview.dto";
import type {
  Overview,
  OverviewClientRow,
  OverviewInsight,
  OverviewIssue,
} from "../types/overview.types";

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function toIssue(dto: OverviewIssueDto): OverviewIssue {
  return {
    adAccountId: dto.adAccountId,
    name: dto.name,
    healthState: dto.healthState,
    lastSyncAt: toDate(dto.lastSyncAt),
    errorHint: dto.errorHint ?? null,
  };
}

function toClientRow(dto: OverviewClientRowDto): OverviewClientRow {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    spend: dto.spend ?? null,
    revenue: dto.revenue ?? null,
    roas: dto.roas ?? null,
    purchases: dto.purchases ?? null,
    cpa: dto.cpa ?? null,
  };
}

function toInsight(dto: OverviewInsightDto): OverviewInsight {
  return {
    id: dto.id,
    severity: dto.severity,
    headline: dto.headline,
    entityName: dto.entityName,
    ctaTarget: dto.ctaTarget ?? null,
  };
}

export function toOverview(dto: OverviewDto): Overview {
  return {
    spend: dto.spend ?? null,
    revenue: dto.revenue ?? null,
    roas: dto.roas ?? null,
    cpa: dto.cpa ?? null,
    purchases: dto.purchases ?? null,
    accountsHealthy: dto.accountsHealthy ?? 0,
    accountsTotal: dto.accountsTotal ?? 0,
    issues: (dto.issues ?? []).map(toIssue),
    clients: (dto.clients ?? []).map(toClientRow),
    insights: (dto.insights ?? []).map(toInsight),
  };
}
