const DAY_MS = 86400000;
const TTL_DAYS_DEFAULT = 7;
const TTL_DAYS_MIN = 1;
const TTL_DAYS_MAX = 30;

export function mediaUrlTtlDays(): number {
  const parsed = Number.parseInt(process.env.WK_MEDIA_URL_TTL_DAYS ?? "", 10);
  const value = Number.isFinite(parsed) ? parsed : TTL_DAYS_DEFAULT;
  return Math.min(Math.max(value, TTL_DAYS_MIN), TTL_DAYS_MAX);
}

export function isMediaStale(
  url: string | null,
  resolvedAt: Date | null,
  now: Date,
  ttlDays: number
): boolean {
  if (url === null || resolvedAt === null) {
    return true;
  }
  return now.getTime() - resolvedAt.getTime() >= ttlDays * DAY_MS;
}

export function isAttemptStale(resolvedAt: Date | null, now: Date, ttlDays: number): boolean {
  return resolvedAt === null || now.getTime() - resolvedAt.getTime() >= ttlDays * DAY_MS;
}

export interface MediaFreshnessFields {
  videoId: string | null;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: Date | null;
  imageResolvedAt: Date | null;
  posterUrl: string | null;
  posterResolvedAt: Date | null;
  sourceUrl: string | null;
  sourceResolvedAt: Date | null;
}

export function anyMediaStale(row: MediaFreshnessFields, now: Date, ttlDays: number): boolean {
  if (isMediaStale(row.thumbnailUrl, row.thumbnailResolvedAt, now, ttlDays)) {
    return true;
  }
  if (isAttemptStale(row.imageResolvedAt, now, ttlDays)) {
    return true;
  }
  if (row.videoId === null) {
    return false;
  }
  return (
    isAttemptStale(row.posterResolvedAt, now, ttlDays) ||
    isAttemptStale(row.sourceResolvedAt, now, ttlDays)
  );
}
