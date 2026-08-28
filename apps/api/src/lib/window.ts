import { problem } from "./problem";

const DAY_MS = 86400000;
const MAX_SPAN_DAYS = 730;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ResolvedWindow {
  since: string;
  until: string;
  spanDays: number;
}

export interface WindowQuery {
  days?: string | number;
  from?: string;
  to?: string;
}

export function shiftDate(date: string, offsetDays: number): string {
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + offsetDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function parseDaysValue(value: string | number | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "30", 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.min(Math.max(parsed, 1), 90);
}

function validIsoDate(value: string): string | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }
  const time = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(time)) {
    return null;
  }
  return new Date(time).toISOString().slice(0, 10) === value ? value : null;
}

function invalidWindow(detail: string): never {
  throw problem(422, "INVALID_WINDOW", detail);
}

export function resolveWindow(query: WindowQuery): ResolvedWindow {
  const hasFrom = typeof query.from === "string" && query.from.length > 0;
  const hasTo = typeof query.to === "string" && query.to.length > 0;
  if (hasFrom && hasTo) {
    const from = validIsoDate(query.from as string);
    const to = validIsoDate(query.to as string);
    if (from === null || to === null) {
      invalidWindow("from and to must be ISO dates formatted as YYYY-MM-DD");
    }
    if ((from as string) > (to as string)) {
      invalidWindow("from must be on or before to");
    }
    const spanDays =
      Math.round(
        (Date.parse(`${to as string}T00:00:00.000Z`) -
          Date.parse(`${from as string}T00:00:00.000Z`)) /
          DAY_MS
      ) + 1;
    if (spanDays > MAX_SPAN_DAYS) {
      invalidWindow(`date span cannot exceed ${MAX_SPAN_DAYS} days`);
    }
    return { since: from as string, until: to as string, spanDays };
  }
  const days = parseDaysValue(query.days);
  const now = new Date();
  const until = now.toISOString().slice(0, 10);
  const since = shiftDate(until, -(days - 1));
  return { since, until, spanDays: days };
}
