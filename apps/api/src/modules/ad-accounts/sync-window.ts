import { shiftDate } from "../../lib/window";

export interface InsightWindowInput {
  today: string;
  syncedThrough: string | null;
  windowDays: number;
  deltaDays: number;
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resolveInsightWindow(
  input: InsightWindowInput
): { since: string; until: string } {
  const until = input.today;
  const windowStart = shiftDate(input.today, -(input.windowDays - 1));
  const deltaStart = shiftDate(input.today, -(input.deltaDays - 1));
  if (input.syncedThrough === null) {
    return { since: windowStart, until };
  }
  const catchUp = input.syncedThrough < deltaStart ? input.syncedThrough : deltaStart;
  return { since: catchUp < windowStart ? windowStart : catchUp, until };
}
