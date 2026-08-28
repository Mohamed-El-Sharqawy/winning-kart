export interface DateRange {
  from: string;
  to: string;
}

function isoDateOf(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return isoDateOf(new Date(`${value}T00:00:00`)) === value;
}

export function defaultRange(): DateRange {
  const today = new Date();
  return {
    from: isoDateOf(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: isoDateOf(today),
  };
}

function shiftDays(days: number): DateRange {
  const today = new Date();
  const from = new Date();
  from.setDate(from.getDate() + days);
  return { from: isoDateOf(from), to: isoDateOf(today) };
}

function presetLast30(): DateRange {
  return shiftDays(-29);
}

function presetQuarter(): DateRange {
  const today = new Date();
  const start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  return { from: isoDateOf(start), to: isoDateOf(today) };
}

function presetYear(): DateRange {
  const today = new Date();
  return { from: isoDateOf(new Date(today.getFullYear(), 0, 1)), to: isoDateOf(today) };
}

export type PresetKey = "month" | "last30" | "quarter" | "year" | "custom";

export const PRESETS: Array<{ key: PresetKey; label: string; range: () => DateRange }> = [
  { key: "month", label: "This month", range: defaultRange },
  { key: "last30", label: "Last 30 days", range: presetLast30 },
  { key: "quarter", label: "This quarter", range: presetQuarter },
  { key: "year", label: "This year", range: presetYear },
];

export function presetKeyOf(range: DateRange): PresetKey {
  const match = PRESETS.find((preset) => {
    const candidate = preset.range();
    return candidate.from === range.from && candidate.to === range.to;
  });
  return match?.key ?? "custom";
}

export function rangeLabel(range: DateRange): string {
  const format = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  return `${format(range.from)} – ${format(range.to)}`;
}
