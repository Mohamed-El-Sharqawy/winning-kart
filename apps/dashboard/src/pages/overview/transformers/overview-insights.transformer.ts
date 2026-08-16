import type { OverviewInsightDto } from "../dto/overview-insights.dto";
import type { OverviewInsight } from "../types/overview-insights.types";

export function toOverviewInsight(dto: OverviewInsightDto): OverviewInsight {
  return {
    id: dto.id,
    severity: dto.severity,
    headline: dto.headline,
    entityName: dto.entityName,
    ctaTarget: dto.ctaTarget ?? null,
  };
}

export function toOverviewInsights(dtos: OverviewInsightDto[]): OverviewInsight[] {
  return dtos.map(toOverviewInsight);
}
