const SOFT_LIMIT_DEFAULT = 70;
const SLOWDOWN_DEFAULT = 400;
const PAUSE_MS = 60000;
const PAUSE_DECAY_PCT = 1;
const PAUSE_THRESHOLD = 85;

function numFromEnv(key: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const SOFT_LIMIT = numFromEnv("WK_META_USAGE_SOFT_LIMIT", SOFT_LIMIT_DEFAULT);
const SLOWDOWN_MS = numFromEnv("WK_META_SLOWDOWN_MS", SLOWDOWN_DEFAULT);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maxMetric(value: string | null, key: string): number | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object") return null;
    let max: number | null = null;
    for (const entry of Object.values(parsed as Record<string, unknown>)) {
      if (entry === null || typeof entry !== "object") continue;
      const metric = (entry as Record<string, unknown>)[key];
      if (typeof metric === "number") max = max === null ? metric : Math.max(max, metric);
    }
    return max;
  } catch {
    return null;
  }
}

export interface RateUsage {
  callCountPct: number | null;
  totalTimePct: number | null;
  appPct: number | null;
}

export interface RateSnapshot {
  callCountPct: number | null;
  totalTimePct: number | null;
  blocked: boolean;
  estClearMin: number | null;
  blockedUntil: string | null;
  updatedAt: string;
}

export class RateGuard {
  private callCountPct: number | null = null;
  private totalTimePct: number | null = null;
  private appPct: number | null = null;
  private blockedUntil: Date | null = null;
  private updatedAt = new Date();

  observe(headers: Headers): void {
    const buc = headers.get("x-business-use-case-usage");
    this.callCountPct = maxMetric(buc, "call_count") ?? this.callCountPct;
    this.totalTimePct = maxMetric(buc, "total_time") ?? this.totalTimePct;
    this.appPct = maxMetric(headers.get("x-app-usage"), "call_count") ?? this.appPct;
    const retryAfter = Number.parseInt(headers.get("x-fb-retry-after") ?? "", 10);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      this.blockedUntil = new Date(Date.now() + retryAfter * 1000);
    }
    this.updatedAt = new Date();
  }

  blocked(): boolean {
    if (this.blockedUntil !== null) {
      if (this.blockedUntil.getTime() > Date.now()) return true;
      this.blockedUntil = null;
    }
    return (this.callCountPct ?? 0) >= 100 || (this.totalTimePct ?? 0) >= 100;
  }

  estimateClearMinutes(): number | null {
    if (this.blockedUntil !== null && this.blockedUntil.getTime() > Date.now()) {
      return Math.max(1, Math.ceil((this.blockedUntil.getTime() - Date.now()) / 60000));
    }
    const call = this.callCountPct ?? 0;
    const time = this.totalTimePct ?? 0;
    if (call < 100 && time < 100) return null;
    return call >= time ? 60 : 10;
  }

  waitMs(): number {
    if (this.blocked()) return PAUSE_MS;
    const hottest = Math.max(this.callCountPct ?? 0, this.totalTimePct ?? 0, this.appPct ?? 0);
    if (hottest >= PAUSE_THRESHOLD) return PAUSE_MS;
    if (hottest >= SOFT_LIMIT) return SLOWDOWN_MS;
    return 0;
  }

  async pace(): Promise<void> {
    for (;;) {
      const wait = this.waitMs();
      if (wait === 0) return;
      await delay(wait);
      if (wait >= PAUSE_MS) {
        this.callCountPct = decay(this.callCountPct);
        this.totalTimePct = decay(this.totalTimePct);
        this.appPct = decay(this.appPct);
      } else {
        return;
      }
    }
  }

  snapshot(): RateSnapshot {
    const blocked = this.blocked();
    return {
      callCountPct: this.callCountPct,
      totalTimePct: this.totalTimePct,
      blocked,
      estClearMin: blocked ? this.estimateClearMinutes() : null,
      blockedUntil: this.blockedUntil !== null ? this.blockedUntil.toISOString() : null,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

function decay(pct: number | null): number | null {
  if (pct === null) return null;
  return Math.max(0, pct - PAUSE_DECAY_PCT);
}

export function storedRateLimitBlocked(
  platformPayload: unknown
): { blocked: true; estClearMin: number | null } | { blocked: false } {
  if (platformPayload === null || typeof platformPayload !== "object") return { blocked: false };
  const raw = (platformPayload as Record<string, unknown>).rateLimit;
  if (raw === null || typeof raw !== "object") return { blocked: false };
  const snapshot = raw as Record<string, unknown>;
  const blockedUntil = typeof snapshot.blockedUntil === "string" ? snapshot.blockedUntil : null;
  if (blockedUntil !== null && Date.parse(blockedUntil) > Date.now()) {
    return { blocked: true, estClearMin: null };
  }
  if (snapshot.blocked === true) {
    const updatedAt = Number.isFinite(Date.parse(snapshot.updatedAt as string))
      ? Date.parse(snapshot.updatedAt as string)
      : 0;
    const est = typeof snapshot.estClearMin === "number" && snapshot.estClearMin > 0 ? snapshot.estClearMin : 60;
    if (Date.now() < updatedAt + est * 60000) {
      return { blocked: true, estClearMin: est };
    }
    return { blocked: false };
  }
  return { blocked: false };
}
