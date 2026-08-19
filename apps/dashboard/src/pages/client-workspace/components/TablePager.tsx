import { Button } from "@/shared/components/Button";

export const PAGE_SIZES = [25, 50, 100];

const SELECT_CLASS =
  "rounded-[8px] border border-volt-border-2 bg-volt-surface-2 px-2 py-1 text-xs text-volt-text focus:border-volt-primary focus:outline-none";

export interface TablePagerProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function TablePager({ total, page, pageSize, onPageChange, onPageSizeChange }: TablePagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages - 1);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(safePage * pageSize + pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-volt-text-3">
      <p className="tabular">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          Rows
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className={SELECT_CLASS}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={safePage === 0}
            onClick={() => onPageChange(safePage - 1)}
            className="px-3 py-1 text-xs"
          >
            Prev
          </Button>
          <span className="tabular">
            {safePage + 1} / {pages}
          </span>
          <Button
            variant="ghost"
            disabled={safePage >= pages - 1}
            onClick={() => onPageChange(safePage + 1)}
            className="px-3 py-1 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
