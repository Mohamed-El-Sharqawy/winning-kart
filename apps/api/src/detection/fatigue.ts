export type FatigueFlag = "fatiguing" | "bleeding" | "scale" | "status_anomaly";

export interface FatigueFinding {
  flag: FatigueFlag;
  reason: string;
}

export interface AdFatigueInput {
  adId: string;
  adStatus: string;
  parentAdSetStatus: string;
  spendRecent: number;
  spendPrior: number;
  ctrRecent: number | null;
  ctrPrior: number | null;
  frequency: number | null;
  roas: number | null;
  spendShare: number | null;
  cohortMedianRoas: number | null;
  cohortMedianSpend: number | null;
}

export const FATIGUE_MIN_FREQUENCY = 4;
export const FATIGUE_CTR_DROP_RATIO = 0.8;
export const FATIGUE_MIN_SPEND_SHARE = 0.1;
export const BLEEDING_MIN_SPEND_SHARE = 0.15;
export const BLEEDING_MAX_ROAS = 1.0;
export const SCALE_ROAS_MULTIPLE = 1.5;
export const SCALE_MAX_SPEND_RATIO = 0.5;
export const SCALE_MAX_FREQUENCY = 3;

function formatValue(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function formatPercent(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function fatiguing(row: AdFatigueInput): FatigueFinding | null {
  if (row.frequency === null || row.frequency < FATIGUE_MIN_FREQUENCY) {
    return null;
  }
  if (row.ctrPrior === null || row.ctrPrior <= 0 || row.ctrRecent === null) {
    return null;
  }
  if (row.ctrRecent > FATIGUE_CTR_DROP_RATIO * row.ctrPrior) {
    return null;
  }
  if (row.spendShare === null || row.spendShare < FATIGUE_MIN_SPEND_SHARE) {
    return null;
  }
  const dropPercent = (1 - row.ctrRecent / row.ctrPrior) * 100;
  return {
    flag: "fatiguing",
    reason: `Frequency ${formatValue(row.frequency)} with CTR down ${formatPercent(dropPercent)}% w/w`,
  };
}

function bleeding(row: AdFatigueInput): FatigueFinding | null {
  if (row.spendShare === null || row.spendShare < BLEEDING_MIN_SPEND_SHARE) {
    return null;
  }
  if (row.roas === null || row.roas >= BLEEDING_MAX_ROAS) {
    return null;
  }
  return {
    flag: "bleeding",
    reason: `${formatPercent(row.spendShare * 100)}% of cohort spend at ${formatValue(row.roas)}x ROAS`,
  };
}

function statusAnomaly(row: AdFatigueInput): FatigueFinding | null {
  if (row.adStatus !== "PAUSED" || row.parentAdSetStatus !== "ACTIVE") {
    return null;
  }
  return { flag: "status_anomaly", reason: "Paused while its ad set is active" };
}

function scale(row: AdFatigueInput): FatigueFinding | null {
  if (row.roas === null || row.cohortMedianRoas === null || row.cohortMedianRoas <= 0) {
    return null;
  }
  if (row.roas < SCALE_ROAS_MULTIPLE * row.cohortMedianRoas) {
    return null;
  }
  if (row.cohortMedianSpend === null || row.cohortMedianSpend <= 0) {
    return null;
  }
  if (row.spendRecent > SCALE_MAX_SPEND_RATIO * row.cohortMedianSpend) {
    return null;
  }
  if (row.frequency === null || row.frequency >= SCALE_MAX_FREQUENCY) {
    return null;
  }
  return { flag: "scale", reason: `${formatValue(row.roas)}x ROAS at low saturation` };
}

export function classifyAd(row: AdFatigueInput): FatigueFinding | null {
  return bleeding(row) ?? fatiguing(row) ?? statusAnomaly(row) ?? scale(row);
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export interface CohortAdRow {
  adSetId: string;
  roas: number | null;
  spendRecent: number;
}

export interface CohortStat {
  medianRoas: number | null;
  medianSpend: number | null;
}

export function cohortStats(rows: CohortAdRow[]): Map<string, CohortStat> {
  const buckets = new Map<string, { roas: number[]; spend: number[] }>();
  for (const row of rows) {
    const bucket = buckets.get(row.adSetId) ?? { roas: [], spend: [] };
    bucket.spend.push(row.spendRecent);
    if (row.roas !== null) {
      bucket.roas.push(row.roas);
    }
    buckets.set(row.adSetId, bucket);
  }
  const stats = new Map<string, CohortStat>();
  for (const [adSetId, bucket] of buckets) {
    stats.set(adSetId, {
      medianRoas: median(bucket.roas),
      medianSpend: median(bucket.spend),
    });
  }
  return stats;
}
