import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface KpiCardProps {
  label: string;
  value: string;
  meta?: string;
  valueClassName?: string;
  chip?: ReactNode;
}

export function KpiCard({ label, value, meta, valueClassName, chip }: KpiCardProps) {
  return (
    <div className="rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("tabular text-2xl font-semibold text-volt-text", valueClassName)}>{value}</span>
        {chip ? <span className="flex items-center">{chip}</span> : null}
        {meta ? <span className="text-xs text-volt-text-3">{meta}</span> : null}
      </div>
    </div>
  );
}
