const DASH = "—";

export function formatMoney(value: number | null, currency?: string): string {
  if (value === null || !Number.isFinite(value)) return DASH;
  const code = currency ?? "AED";
  try {
    return value.toLocaleString("en-AE", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

export function formatAed(value: number | null): string {
  return formatMoney(value, "AED");
}

export function formatDate(value: Date): string {
  return value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatRoas(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return DASH;
  return `${value.toFixed(2)}x`;
}

export function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return DASH;
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return DASH;
  return value.toLocaleString("en", { notation: "compact", maximumFractionDigits: 1 });
}

export function formatDecimal(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return DASH;
  return value.toFixed(digits);
}

export function formatRelativeTime(value: Date | string | null): string {
  if (value === null) return DASH;
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  if (!Number.isFinite(ms)) return DASH;
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function roasTone(value: number | null): string {
  if (value === null) return "text-volt-text";
  if (value >= 3) return "text-volt-up";
  if (value < 1) return "text-volt-down";
  return "text-volt-text";
}

export function campaignRowTone(value: number | null): string {
  if (value === null) return "";
  if (value >= 3) return "bg-volt-up-tint";
  if (value < 1) return "bg-volt-down-tint";
  return "";
}
