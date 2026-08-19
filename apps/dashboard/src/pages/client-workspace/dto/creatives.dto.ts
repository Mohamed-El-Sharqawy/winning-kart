export type FatigueFlagDto = "fatiguing" | "bleeding" | "scale" | "status_anomaly";

export interface CreativeFatigueDto {
  flag: FatigueFlagDto;
  reason: string;
}

export interface CreativeDto {
  id: string;
  adSetId: string;
  adSetName: string;
  campaignName: string;
  platformAdId: string;
  name: string;
  status: string;
  format: string;
  bodyCopy: string | null;
  creativeId: string;
  thumbnailUrl: string | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  fatigue: CreativeFatigueDto | null;
}

export interface FatigueSummaryDto {
  topCreativeSpendShare: number | null;
  top3SpendShare: number | null;
  concentration: "top1" | "top3" | null;
  counts: {
    fatiguing: number;
    bleeding: number;
    scale: number;
    status_anomaly: number;
  };
}
