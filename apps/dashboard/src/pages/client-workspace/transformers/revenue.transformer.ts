import type {
  CreateRevenueSourceResponseDto,
  RevenueSnapshotDto,
  RevenueSourceDto,
} from "../dto/revenue.dto";
import type {
  CreatedRevenueSource,
  RevenueEvent,
  RevenueSnapshot,
  RevenueSource,
} from "../types/revenue.types";

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

export function toRevenueEvent(dto: RevenueSnapshotDto["events"][number]): RevenueEvent {
  return {
    id: dto.id,
    sourceOrderId: dto.sourceOrderId,
    tsUtc: new Date(dto.tsUtc),
    value: dto.value,
    currency: dto.currency,
    matchTier: dto.matchTier,
    resolvedEntityLevel: dto.resolvedEntityLevel,
    campaignName: dto.campaignName ?? null,
    sourceName: dto.sourceName,
  };
}

export function toRevenueSnapshot(dto: RevenueSnapshotDto): RevenueSnapshot {
  return {
    events: dto.events.map(toRevenueEvent),
    summary: dto.summary,
  };
}

export function toRevenueSource(dto: RevenueSourceDto): RevenueSource {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    lastEventAt: toDate(dto.lastEventAt),
    createdAt: new Date(dto.createdAt),
  };
}

export function toRevenueSources(dtos: RevenueSourceDto[]): RevenueSource[] {
  return dtos.map(toRevenueSource);
}

export function toCreatedRevenueSource(dto: CreateRevenueSourceResponseDto): CreatedRevenueSource {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: new Date(dto.createdAt),
    ingestKey: dto.ingestKey,
  };
}
