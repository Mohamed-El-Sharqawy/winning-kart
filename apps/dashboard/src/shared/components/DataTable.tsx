import { cn } from "@/lib/cn";

const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  align?: keyof typeof ALIGN_CLASSES;
  render?: (row: Row) => React.ReactNode;
}

export interface DataTableProps<Row> {
  columns: Array<DataTableColumn<Row>>;
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  rowClassName?: (row: Row) => string;
}

export function DataTable<Row>({ columns, rows, rowKey, onRowClick, rowClassName }: DataTableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded-wk border border-volt-border bg-volt-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-volt-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wider text-volt-text-3",
                  ALIGN_CLASSES[column.align ?? "left"],
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={(event) => {
                if (event.target instanceof HTMLElement && event.target.closest("a, button")) return;
                onRowClick?.(row);
              }}
              className={cn(
                "border-b border-volt-border last:border-b-0 hover:bg-volt-surface-2/60",
                onRowClick !== undefined && "cursor-pointer",
                rowClassName?.(row),
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3 text-volt-text-2", ALIGN_CLASSES[column.align ?? "left"])}
                >
                  {column.render
                    ? column.render(row)
                    : renderFallback(row[column.key as keyof Row])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderFallback(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return typeof value === "object" ? "-" : String(value);
}
