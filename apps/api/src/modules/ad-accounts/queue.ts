import { randomUUID } from "node:crypto";
import { problem } from "../../lib/problem";
import { storedRateLimitBlocked } from "../../platforms/meta/rate-limit";
import { AdAccountsModel } from "./model";
import type { SyncRunRow } from "./model";
import { AdAccountsService, SyncCancelledError } from "./service";

const model = new AdAccountsModel();
const service = new AdAccountsService(model);
const PROGRESS_WRITE_THROTTLE_MS = 1000;

let workerActive = false;

export async function enqueueSync(adAccountId: string): Promise<{ runId: string }> {
  const account = await model.findById(adAccountId);
  if (!account) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${adAccountId}`);
  }
  const block = storedRateLimitBlocked(account.platformPayload);
  if (block.blocked) {
    const estimate = block.estClearMin !== null ? ` ~${block.estClearMin} min` : "";
    throw problem(
      429,
      "RATE_LIMITED",
      `Meta rate limit active; do not retry until the window clears.${estimate}`,
      "rate_limited"
    );
  }
  const active = await model.activeSyncRun(adAccountId);
  if (active !== null) {
    return { runId: active.id };
  }
  const run = await model.createSyncRun(randomUUID(), adAccountId);
  void kickWorker();
  return { runId: run.id };
}

export async function latestRun(adAccountId: string): Promise<SyncRunRow | null> {
  return model.latestSyncRun(adAccountId);
}

export async function cancelRun(adAccountId: string, runId: string): Promise<boolean> {
  const run = await model.getSyncRun(runId);
  if (run === null || run.adAccountId !== adAccountId) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No sync run with id ${runId}`);
  }
  if (run.status !== "queued" && run.status !== "running") {
    return false;
  }
  await model.updateSyncRun(runId, { status: "cancelled", endedAt: new Date() });
  return true;
}

export async function recoverInterruptedRuns(): Promise<void> {
  await model.markStaleSyncRunsInterrupted();
}

async function kickWorker(): Promise<void> {
  if (workerActive) {
    return;
  }
  workerActive = true;
  try {
    for (;;) {
      const queued = await model.oldestQueuedSyncRun();
      if (queued === null) {
        return;
      }
      await executeRun(queued.id, queued.adAccountId);
    }
  } finally {
    workerActive = false;
  }
}

async function executeRun(runId: string, adAccountId: string): Promise<void> {
  await model.updateSyncRun(runId, { status: "running", startedAt: new Date() });
  const stageLog: Array<{ stage: string; status: string; detail?: unknown }> = [];
  let lastWrite = 0;

  const persist = async (force: boolean, summary?: unknown): Promise<void> => {
    const now = Date.now();
    if (!force && now - lastWrite < PROGRESS_WRITE_THROTTLE_MS) {
      return;
    }
    lastWrite = now;
    const current = await model.getSyncRun(runId);
    if (current === null || current.status !== "running") {
      return;
    }
    await model.updateSyncRun(runId, {
      progress: summary === undefined ? { stages: stageLog } : { stages: stageLog, summary },
    });
  };

  try {
    const outcome = await service.sync(adAccountId, {
      shouldCancel: async () => {
        const current = await model.getSyncRun(runId);
        return current === null || current.status === "cancelled";
      },
      onStage: async (info) => {
        stageLog.push({ stage: info.stage, status: info.status, detail: info.detail });
        await persist(false);
      },
    });
    if (!outcome.ok) {
      await model.updateSyncRun(runId, {
        status: "failed",
        error: `stage ${outcome.failedStage} failed (${outcome.errorClass})`,
        errorClass: outcome.errorClass,
        progress: { stages: outcome.stages },
        endedAt: new Date(),
      });
      return;
    }
    stageLog.push(...outcome.stages.filter((s) => !stageLog.some((e) => e.stage === s.stage)));
    await model.updateSyncRun(runId, {
      status: "succeeded",
      progress: { stages: outcome.stages, summary: outcome.summary },
      graphCalls: outcome.summary.graphCalls,
      endedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof SyncCancelledError) {
      await model.updateSyncRun(runId, { status: "cancelled", endedAt: new Date() });
      return;
    }
    const message = error instanceof Error ? error.message : "sync failed";
    await model.updateSyncRun(runId, {
      status: "failed",
      error: message,
      errorClass: "upstream_error",
      endedAt: new Date(),
    });
  }
  await persist(true);
}
