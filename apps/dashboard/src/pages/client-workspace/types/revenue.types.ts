export type MatchTier = "A" | "B" | "C";

export interface RevenueEvent {
  id: string;
  sourceOrderId: string;
  tsUtc: Date;
  value: number;
  currency: string;
  matchTier: MatchTier;
  resolvedEntityLevel: string;
  campaignName: string | null;
  sourceName: string;
}

export interface RevenueTierSummary {
  count: number;
  value: number;
}

export interface RevenueSummary {
  totalValue: number;
  currency: string;
  count: number;
  tierA: RevenueTierSummary;
  tierB: RevenueTierSummary;
  tierC: RevenueTierSummary;
  matchedPct: number;
}

export interface RevenueSnapshot {
  events: RevenueEvent[];
  summary: RevenueSummary;
}

export interface RevenueSource {
  id: string;
  name: string;
  status: string;
  lastEventAt: Date | null;
  createdAt: Date;
}

export interface CreatedRevenueSource {
  id: string;
  name: string;
  createdAt: Date;
  ingestKey: string;
}
