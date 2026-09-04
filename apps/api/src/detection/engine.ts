import { DetectionModel } from "./model";
import { priorityScore } from "./priority";
import { evaluateDetection } from "./rules";
import type { AlertCandidate, Severity } from "./rules";

export const MAX_NEW_ALERTS_PER_CLIENT_24H = 5;

const model = new DetectionModel();

const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

export interface DetectionResult {
  alerts: number;
  insights: number;
}

async function applyRateLimit(
  clientId: string,
  candidates: AlertCandidate[]
): Promise<void> {
  if (candidates.length === 0) {
    return;
  }
  const existing = await model.listExistingAlertKeys(candidates.map((row) => row.dedupeKey));
  let newCount = await model.countRecentAlerts(clientId, 24);
  const ordered = [...candidates].sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] ||
      b.affectedSpend7d - a.affectedSpend7d
  );
  for (const candidate of ordered) {
    if (candidate.dataTrust || existing.has(candidate.dedupeKey)) {
      continue;
    }
    if (newCount >= MAX_NEW_ALERTS_PER_CLIENT_24H) {
      candidate.severity = "info";
      candidate.supportingMetrics = {
        ...candidate.supportingMetrics,
        downgradedByRateLimit: true,
      };
    }
    newCount += 1;
  }
}

export async function runDetectionForAccount(accountId: string): Promise<DetectionResult> {
  try {
    const data = await model.loadRecentWindows(accountId);
    if (data === null) {
      return { alerts: 0, insights: 0 };
    }
    const { alerts: alertCandidates, insights: insightCandidates } = evaluateDetection(data);
    await applyRateLimit(data.account.clientId, alertCandidates);
    for (const candidate of alertCandidates) {
      await model.upsertAlert(candidate.dedupeKey, {
        clientId: data.account.clientId,
        adAccountId: candidate.adAccountId,
        ruleKey: candidate.ruleKey,
        entityLevel: candidate.entityLevel,
        entityId: candidate.entityId,
        entityName: candidate.entityName,
        severity: candidate.severity,
        whatHappened: candidate.whatHappened,
        headline: candidate.headline,
        supportingMetrics: candidate.supportingMetrics,
        priorityScore: priorityScore(candidate.severity, candidate.affectedSpend7d),
      });
    }
    for (const candidate of insightCandidates) {
      await model.upsertInsight(candidate.dedupeKey, {
        clientId: data.account.clientId,
        adAccountId: candidate.adAccountId,
        insightType: candidate.insightType,
        entityLevel: candidate.entityLevel,
        entityId: candidate.entityId,
        entityName: candidate.entityName,
        severity: candidate.severity,
        headline: candidate.headline,
        supportingMetrics: candidate.supportingMetrics,
        attributionStatus: candidate.attributionStatus,
        priorityScore: priorityScore(candidate.severity, candidate.affectedSpend7d),
      });
    }
    return { alerts: alertCandidates.length, insights: insightCandidates.length };
  } catch (error) {
    console.error("detection run failed", error);
    return { alerts: 0, insights: 0 };
  }
}
