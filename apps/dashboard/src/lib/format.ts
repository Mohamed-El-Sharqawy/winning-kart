export function formatAed(value: number): string {
  return `AED ${value.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}
