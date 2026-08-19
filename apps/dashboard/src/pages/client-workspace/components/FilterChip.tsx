export interface FilterChipProps {
  label: string;
  onClear: () => void;
}

export function FilterChip({ label, onClear }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-volt-border-2 bg-volt-surface px-3 py-1 text-xs text-volt-text-2">
      <span className="max-w-[220px] truncate">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear ad set filter"
        className="cursor-pointer text-volt-text-3 transition-colors hover:text-volt-text"
      >
        ×
      </button>
    </span>
  );
}
