export interface StatChipItem {
  label: string;
  value: string;
}

export function StatChips({ items }: { items: StatChipItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-volt-border bg-volt-surface-2 px-2.5 py-0.5 font-mono tabular-nums text-xs text-volt-text"
        >
          <span className="text-volt-text-3">{item.label}</span>
          {item.value}
        </span>
      ))}
    </div>
  );
}
