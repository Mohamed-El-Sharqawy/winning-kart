export interface KpiCardProps {
  label: string;
  value: string;
  meta?: string;
}

export function KpiCard({ label, value, meta }: KpiCardProps) {
  return (
    <div className="rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular text-2xl font-semibold text-volt-text">{value}</span>
        {meta ? <span className="text-xs text-volt-text-3">{meta}</span> : null}
      </div>
    </div>
  );
}
