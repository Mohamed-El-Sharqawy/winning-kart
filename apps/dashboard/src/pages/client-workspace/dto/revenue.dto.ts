export type MatchTierDto = "A" | "B" | "C";

export interface RevenueEventDto {
  id: string;
  sourceOrderId: string;
  tsUtc: string;
  value: number;
  currency: string;
  matchTier: MatchTierDto;
  resolvedEntityLevel: string;
  campaignName: string | null;
  sourceName: string;
}

export interface RevenueTierSummaryDto {
  count: number;
  value: number;
}

export interface RevenueSummaryDto {
  totalValue: number;
  currency: string;
  count: number;
  tierA: RevenueTierSummaryDto;
  tierB: RevenueTierSummaryDto;
  tierC: RevenueTierSummaryDto;
  matchedPct: number;
}

export interface RevenueSnapshotDto {
  events: RevenueEventDto[];
  summary: RevenueSummaryDto;
}

export interface CreateRevenueSourceResponseDto {
  id: string;
  name: string;
  createdAt: string;
  ingestKey: string;
}

export interface RevenueSourceDto {
  id: string;
  name: string;
  status: string;
  lastEventAt: string | null;
  createdAt: string;
}
