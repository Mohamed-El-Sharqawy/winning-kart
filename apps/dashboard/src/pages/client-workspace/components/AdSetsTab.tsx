import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/Button";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { EmptyState } from "@/shared/components/EmptyState";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { statusFilterLabel } from "../data/gallery-copy.data";
import { useAdSets, useAdSetsSummary } from "../services/ad-sets.service";
import type { ListFilters } from "../services/list-query";
import type { AdSet } from "../types/ad-sets.types";
import type { StatusFilter } from "../types/creatives.types";
import { AdSetsTable, MAX_COMPARE } from "./AdSetsTable";
import { CompareDrawer } from "./CompareDrawer";
import { ListFilterBar } from "./ListFilterBar";
import { ListKpiCards } from "./ListKpiCards";
import { SkeletonRows } from "./SkeletonRows";
import { TablePager } from "./TablePager";

export interface AdSetsTabProps {
  accountId: string | null;
  currency: string;
  range: DateRange;
  rangeExplicit: boolean;
  clientSlug: string;
}

export function AdSetsTab({ accountId, currency, range, rangeExplicit, clientSlug }: AdSetsTabProps) {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [searchInput, setSearchInput] = useState("");
  const q = useDebounce(searchInput, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRows, setSelectedRows] = useState<AdSet[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const filters = useMemo<ListFilters>(() => ({ status, q }), [status, q]);
  const adSets = useAdSets(accountId, range, rangeExplicit, filters, undefined, page, pageSize);
  const summary = useAdSetsSummary(accountId, range, rangeExplicit, filters, undefined);

  const rows = adSets.data?.items ?? [];
  const total = adSets.data?.total ?? 0;
  const selected = selectedRows;
  const selectedIds = selectedRows.map((row) => row.id);

  useEffect(() => {
    setPage(0);
  }, [accountId, status, q, range.from, range.to, rangeExplicit]);

  useEffect(() => {
    setSelectedRows([]);
  }, [accountId]);

  useEffect(() => {
    if (compareOpen && selected.length < 2) setCompareOpen(false);
  }, [compareOpen, selected.length]);

  function toggleSelected(row: AdSet) {
    setSelectedRows((current) => {
      if (current.some((item) => item.id === row.id)) {
        return current.filter((item) => item.id !== row.id);
      }
      if (current.length >= MAX_COMPARE) return current;
      return [...current, row];
    });
  }

  const unfiltered = status === "all" && q.trim() === "";

  return (
    <div className="flex flex-col gap-4">
      {summary.data ? <ListKpiCards summary={summary.data} currency={currency} /> : null}
      <ListFilterBar
        status={status}
        onStatus={setStatus}
        searchInput={searchInput}
        onSearchInput={setSearchInput}
        searchLabel="Search ad sets"
      />
      {adSets.isPending ? (
        <SkeletonRows rows={8} columns={10} />
      ) : rows.length === 0 ? (
        unfiltered ? (
          <EmptyState title="No ad sets yet" hint="Sync the ad account to pull ad sets." />
        ) : (
          <EmptyState
            title={`No ${statusFilterLabel(status).toLowerCase()} ad sets in this scope`}
            hint="Switch the status filter to widen the scope."
          />
        )
      ) : (
        <>
          <div className="flex items-center justify-end gap-3">
            {selected.length === MAX_COMPARE ? (
              <span className="text-xs text-volt-text-3">Up to {MAX_COMPARE} ad sets can be compared</span>
            ) : null}
            {selected.length >= 2 ? (
              <Button onClick={() => setCompareOpen(true)}>Compare ({selected.length})</Button>
            ) : null}
          </div>
          <AdSetsTable adSets={rows} selectedIds={selectedIds} onToggle={toggleSelected} clientSlug={clientSlug} />
        </>
      )}
      {!adSets.isPending && total > 0 ? (
        <TablePager
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      ) : null}
      <CompareDrawer adSets={selected} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}
