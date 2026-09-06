import { problem } from "../../lib/problem";
import { resolveWindow } from "../../lib/window";
import type { WindowQuery } from "../../lib/window";
import { round2 } from "../../platforms/meta";
import { scanAdsRows } from "./ads-scan";
import type { FullAdsScanInput } from "./ads-scan";
import { classifyAdsRow } from "./ads-decoration";
import type { AdsRow } from "./ads-decoration";
import { deriveAdMetrics } from "./ads-metrics";
import { trendWindows } from "./ads-list";
import { parseAdsFilters } from "./ads-query";
import type { AdsPageInput } from "./ads-repository";

export interface FatigueSummaryPayload {
  topCreativeSpendShare: number | null;
  top3SpendShare: number | null;
  concentration: "top1" | "top3" | null;
  counts: { fatiguing: number; bleeding: number; scale: number; status_anomaly: number };
}

export interface FatigueSummaryDeps {
  findAccount(id: string): Promise<{ id: string } | undefined>;
  pageAds(input: AdsPageInput): Promise<AdsRow[]>;
}

export interface FatigueSummaryQuery extends WindowQuery {
  status?: string;
  adSetId?: string;
  campaignId?: string;
  flag?: string;
  format?: string;
  q?: string;
}

interface FatigueAccumulator {
  counts: FatigueSummaryPayload["counts"];
  top: number[];
  totalSpend: number;
}

function accumulate(row: AdsRow, flag: string | null, acc: FatigueAccumulator): void {
  const metrics = deriveAdMetrics(row.sums);
  const finding = classifyAdsRow(row, metrics);
  if (flag !== null && (finding === null || finding.flag !== flag)) {
    return;
  }
  if (finding !== null) {
    acc.counts[finding.flag] += 1;
  }
  const spend = metrics?.spend ?? null;
  if (spend !== null && spend > 0) {
    acc.top.push(spend);
    acc.top.sort((a, b) => b - a);
    if (acc.top.length > 3) {
      acc.top.length = 3;
    }
    acc.totalSpend += spend;
  }
}

export async function fatigueSummary(
  deps: FatigueSummaryDeps,
  accountId: string,
  query: FatigueSummaryQuery
): Promise<FatigueSummaryPayload> {
  const account = await deps.findAccount(accountId);
  if (account === undefined) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${accountId}`);
  }
  const window = resolveWindow(query);
  const filters = parseAdsFilters(query);
  const input: FullAdsScanInput = {
    accountId,
    since: window.since,
    until: window.until,
    ...trendWindows(window),
    filters,
    sort: "spend",
    order: "desc",
  };
  const acc: FatigueAccumulator = {
    counts: { fatiguing: 0, bleeding: 0, scale: 0, status_anomaly: 0 },
    top: [],
    totalSpend: 0,
  };
  await scanAdsRows(deps.pageAds, input, null, (row) => {
    accumulate(row, filters.flag, acc);
    return true;
  });
  const hasSpend = acc.totalSpend > 0 && acc.top.length > 0;
  const top1 = hasSpend ? round2(acc.top[0] / acc.totalSpend) : null;
  const top3 = hasSpend ? round2(acc.top.reduce((sum, spend) => sum + spend, 0) / acc.totalSpend) : null;
  return {
    topCreativeSpendShare: top1,
    top3SpendShare: top3,
    concentration:
      top1 !== null && top1 >= 0.5 ? "top1" : top3 !== null && top3 >= 0.8 ? "top3" : null,
    counts: acc.counts,
  };
}
