import { AdAccountsModel } from "../modules/ad-accounts/model";
import { AdAccountsService } from "../modules/ad-accounts/service";

const model = new AdAccountsModel();
const service = new AdAccountsService(model);
const HOURLY_MS = 3600000;
const TOKEN_WARNING_MS = 7 * 86400000;

export function startSyncCron(): void {
  if (process.env.WK_SYNC_CRON === "off") {
    return;
  }
  const tick = (): void => {
    void runSyncTick();
  };
  const bunModuleName = "bun";
  void import(bunModuleName)
    .then((loaded: unknown) => {
      const cron = (loaded as { cron?: unknown } | null)?.cron;
      if (typeof cron === "function") {
        (cron as (expression: string, handler: () => void) => unknown)(
          "0 * * * *",
          tick
        );
        return;
      }
      scheduleInterval(tick);
    })
    .catch(() => {
      scheduleInterval(tick);
    });
}

function scheduleInterval(tick: () => void): void {
  const timer = setInterval(tick, HOURLY_MS) as unknown as { unref(): void };
  timer.unref();
}

async function applyTokenExpiry(): Promise<void> {
  const accounts = await model.listUserTokenExpiries();
  const now = Date.now();
  for (const account of accounts) {
    const expiresAt = account.tokenExpiresAt?.getTime();
    if (expiresAt === undefined) {
      continue;
    }
    if (expiresAt <= now) {
      await model.setHealthState(account.id, "error");
    } else if (expiresAt - now <= TOKEN_WARNING_MS) {
      await model.setHealthStateIfNotError(account.id, "warning");
    }
  }
}

async function runSyncTick(): Promise<void> {
  await applyTokenExpiry();
  const accounts = await model.listSyncEligible();
  for (const account of accounts) {
    try {
      await service.sync(account.id);
    } catch {
    }
  }
}
