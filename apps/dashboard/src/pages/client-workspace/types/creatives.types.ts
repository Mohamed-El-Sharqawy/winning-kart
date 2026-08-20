export type FatigueFlag = "fatiguing" | "bleeding" | "scale" | "status_anomaly";

export interface CreativeFatigue {
  flag: FatigueFlag;
  reason: string;
}

export interface Creative {
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
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  spend: number | null;
  revenue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  frequency: number | null;
  spendShare: number | null;
  fatigue: CreativeFatigue | null;
}

export type ConcentrationKind = "top1" | "top3";

export interface FatigueCounts {
  fatiguing: number;
  bleeding: number;
  scale: number;
  status_anomaly: number;
}

export interface FatigueSummary {
  topCreativeSpendShare: number | null;
  top3SpendShare: number | null;
  concentration: ConcentrationKind | null;
  counts: FatigueCounts;
}
