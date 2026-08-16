import type { InsightDto } from "../dto/insights.dto";
import type { Insight, InsightContributor } from "../types/insights.types";

function toContributors(decomposition: Record<string, number> | null): InsightContributor[] {
  if (!decomposition) return [];
  return Object.entries(decomposition)
    .filter(([, pct]) => Number.isFinite(pct))
    .map(([name, pct]) => ({ name, pct: Math.round(pct) }))
    .sort((a, b) => b.pct - a.pct);
}

export function toInsight(dto: InsightDto): Insight {
  return {
    ...dto,
    primaryCause: dto.primaryCause ?? null,
    decomposition: toContributors(dto.decomposition),
    ctaTarget: dto.ctaTarget ?? null,
    acceptedAsTaskId: dto.acceptedAsTaskId ?? null,
    notUsefulCount: dto.notUsefulCount ?? 0,
    detectedAt: new Date(dto.detectedAt),
  };
}

export function toInsights(dtos: InsightDto[]): Insight[] {
  return dtos.map(toInsight);
}
