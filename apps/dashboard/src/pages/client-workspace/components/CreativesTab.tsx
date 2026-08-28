import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/shared/components/Badge";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { EmptyState } from "@/shared/components/EmptyState";
import { useClients } from "@/shared/services/clients.service";
import { FATIGUE_FLAG_COPY, FATIGUE_FLAG_ORDER } from "../data/gallery-copy.data";
import { adAccountsQueryOptions } from "../services/ad-accounts.service";
import { useCreatives, useFatigueSummary } from "../services/creatives.service";
import type { Creative, FatigueFlag } from "../types/creatives.types";
import { CreativeCard } from "./CreativeCard";
import { CreativeDetailModal } from "./CreativeDetailModal";
import { FilterChip } from "./FilterChip";
import { SkeletonRows } from "./SkeletonRows";
import { TablePager } from "./TablePager";

const SELECT_CLASS =
  "rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";
const COUNTED_FLAGS: FatigueFlag[] = ["fatiguing", "bleeding", "scale"];
const SORT_LABELS: Record<SortKey, string> = { spend: "Spend", roas: "ROAS", ctr: "CTR", frequency: "Frequency" };
type SortKey = "spend" | "roas" | "ctr" | "frequency";

export interface CreativesTabProps {
  accountId: string | null;
  range: DateRange;
  rangeExplicit: boolean;
  clientSlug: string;
}

export function CreativesTab({ accountId, range, rangeExplicit, clientSlug }: CreativesTabProps) {
  const [flagFilter, setFlagFilter] = useState<FatigueFlag | "all">("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [selected, setSelected] = useState<Creative | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const { adSet, adSetName } = useSearch({ from: "/clients/$slug" });
  const navigate = useNavigate();
  const { data: creatives, isPending } = useCreatives(accountId, range, rangeExplicit);
  const { data: summary } = useFatigueSummary(accountId, range, rangeExplicit);
  const { data: clients } = useClients();
  const client = clients?.find((candidate) => candidate.slug === clientSlug) ?? null;
  const { data: accounts } = useQuery({ ...adAccountsQueryOptions(client?.id ?? ""), enabled: client !== null });
  const actId = accounts?.find((account) => account.id === accountId)?.adAccountId ?? null;

  const rows = creatives ?? [];
  const scoped = adSet === undefined ? rows : rows.filter((row) => row.adSetId === adSet);
  const visible = scoped
    .filter((row) => flagFilter === "all" || row.fatigue?.flag === flagFilter)
    .filter((row) => formatFilter === "all" || row.format === formatFilter)
    .sort((a, b) => (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity));
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = visible.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const concentrationRaw =
    summary === undefined || summary.concentration === null
      ? null
      : (summary.concentration === "top1" ? summary.topCreativeSpendShare : summary.top3SpendShare);
  const concentrationPct = concentrationRaw === null ? null : Math.round(concentrationRaw * 100);

  function clearAdSetFilter() {
    void navigate({
      to: "/clients/$slug",
      params: { slug: clientSlug },
      search: (prev) => ({ ...prev, tab: "creatives", adSet: undefined, adSetName: undefined }),
    });
  }

  if (isPending) {
    return <SkeletonRows rows={6} columns={4} />;
  }
  if (rows.length === 0) {
    return <EmptyState title="No creatives yet — sync the ad account first" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {summary && summary.concentration !== null && concentrationPct !== null ? (
        <p className="rounded-[10px] border border-volt-border bg-volt-surface px-4 py-3 text-[13px] text-volt-text-2">
          Concentration risk:{" "}
          {summary.concentration === "top1" ? "top creative is" : "top 3 creatives are"} {concentrationPct}% of spend
        </p>
      ) : null}
      {summary ? (
        <div className="flex flex-wrap gap-2">
          {COUNTED_FLAGS.map((flag) => (
            <Badge key={flag} variant={FATIGUE_FLAG_COPY[flag].badgeVariant}>
              {FATIGUE_FLAG_COPY[flag].label} {summary.counts[flag]}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        {adSet !== undefined ? <FilterChip label={`Ad set: ${adSetName ?? adSet}`} onClear={clearAdSetFilter} /> : null}
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Fatigue
          <select
            value={flagFilter}
            onChange={(event) => setFlagFilter(event.target.value as FatigueFlag | "all")}
            className={SELECT_CLASS}
          >
            <option value="all">All</option>
            {FATIGUE_FLAG_ORDER.map((flag) => (
              <option key={flag} value={flag}>{FATIGUE_FLAG_COPY[flag].label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Format
          <select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)} className={SELECT_CLASS}>
            <option value="all">All</option>
            {Array.from(new Set(rows.map((row) => row.format))).map((format) => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Sort
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className={SELECT_CLASS}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>{SORT_LABELS[key]}</option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No creatives match these filters" hint="Adjust the filters to see more creatives." />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {paged.map((creative) => (
              <CreativeCard key={creative.id} creative={creative} onSelect={() => setSelected(creative)} />
            ))}
          </div>
          <TablePager
            total={visible.length}
            page={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
          />
        </>
      )}
      {selected !== null ? <CreativeDetailModal creative={selected} actId={actId} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
