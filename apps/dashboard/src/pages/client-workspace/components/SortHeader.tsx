import { cn } from "@/lib/cn";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface SortHeaderProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}

export function SortHeader({ label, active, direction, onClick }: SortHeaderProps) {
  const width = direction === "asc" ? "border-b-[5px]" : "border-t-[5px]";
  const tone =
    direction === "asc"
      ? active
        ? "border-b-volt-text-3"
        : "border-b-volt-border-2 group-hover:border-b-volt-text-3"
      : active
        ? "border-t-volt-text-3"
        : "border-t-volt-border-2 group-hover:border-t-volt-text-3";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex cursor-pointer select-none items-center gap-1.5"
    >
      <span className={active ? "text-volt-text" : "text-volt-text-3 group-hover:text-volt-text-2"}>{label}</span>
      <span aria-hidden className={cn("border-l-[4px] border-r-[4px] border-transparent transition-colors", width, tone)} />
    </button>
  );
}

export function sortHeaderCell(props: SortHeaderProps): string {
  return <SortHeader {...props} /> as unknown as string;
}

export function nextSortState(current: SortState | null, key: string, fallback: SortDirection): SortState {
  if (current === null || current.key !== key) return { key, direction: fallback };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

export type SortValue = string | number | null | undefined;

export function sortRows<Row>(rows: Row[], sort: SortState | null, value: (row: Row, key: string) => SortValue): Row[] {
  if (sort === null) return rows;
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = value(a, sort.key);
    const right = value(b, sort.key);
    const leftNull = left === null || left === undefined;
    const rightNull = right === null || right === undefined;
    if (leftNull || rightNull) return leftNull && rightNull ? 0 : leftNull ? 1 : -1;
    if (typeof left === "string" || typeof right === "string") {
      return String(left).localeCompare(String(right), "en", { sensitivity: "base" }) * factor;
    }
    return (left - right) * factor;
  });
}
