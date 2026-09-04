import { cn } from "@/lib/cn";

export function SkeletonRows({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto rounded-wk border border-volt-border bg-volt-surface">
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-6 border-b border-volt-border px-4 py-3.5 last:border-b-0"
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  "h-4 animate-pulse rounded bg-volt-surface-2",
                  columnIndex === 0 ? "w-48 shrink-0" : "w-20 shrink-0",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
