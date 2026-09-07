import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/Button";
import { DateRangeControl } from "@/shared/components/DateRangeControl";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { EmptyState } from "@/shared/components/EmptyState";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { Client } from "@/shared/types/clients.types";
import { statusFilterLabel } from "../data/gallery-copy.data";
import { useAdAccounts } from "../services/ad-accounts.service";
import { useCampaigns, useCampaignsSummary } from "../services/campaigns.service";
import { useCampaignSync } from "../services/use-campaign-sync";
import type { ListFilters } from "../services/list-query";
import type { StatusFilter } from "../types/creatives.types";
import { CampaignsTable } from "./CampaignsTable";
import { ListFilterBar } from "./ListFilterBar";
import { ListKpiCards } from "./ListKpiCards";
import { SkeletonRows } from "./SkeletonRows";
import { TablePager } from "./TablePager";

const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

export interface CampaignsTabProps {
  client: Client;
  range: DateRange;
  rangeExplicit: boolean;
  onApplyRange: (range: DateRange | undefined) => void;
  canSync: boolean;
}

export function CampaignsTab({ client, range, rangeExplicit, onApplyRange, canSync }: CampaignsTabProps) {
  const { data: accounts, isPending: accountsPending } = useAdAccounts(client.id);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [searchInput, setSearchInput] = useState("");
  const q = useDebounce(searchInput, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const list = accounts ?? [];
  const selectedId = accountId ?? list[0]?.id ?? null;
  const currency = list.find((account) => account.id === selectedId)?.currency ?? "AED";
  const filters = useMemo<ListFilters>(() => ({ status, q }), [status, q]);
  const campaigns = useCampaigns(selectedId, range, rangeExplicit, filters, page, pageSize);
  const summary = useCampaignsSummary(selectedId, range, rangeExplicit, filters);
  const { message: syncMessage, startSync, enqueue } = useCampaignSync(selectedId);

  useEffect(() => {
    setPage(0);
  }, [selectedId, status, q, range.from, range.to, rangeExplicit]);

  if (accountsPending) {
    return <p className="text-sm text-volt-text-3">Loading ad accounts…</p>;
  }
  if (list.length === 0) {
    return (
      <EmptyState
        title="No ad accounts yet"
        hint="Add an ad account on the Ad Accounts tab, then sync it to pull campaigns."
      />
    );
  }

  const rows = campaigns.data?.items ?? [];
  const total = campaigns.data?.total ?? 0;
  const unfiltered = status === "all" && q.trim() === "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          Ad account
          <select
            value={selectedId ?? ""}
            onChange={(event) => setAccountId(event.target.value)}
            className={SELECT_CLASS}
          >
            {list.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <DateRangeControl
          from={rangeExplicit ? range.from : undefined}
          to={rangeExplicit ? range.to : undefined}
          onApply={onApplyRange}
        />
      </div>
      {summary.data ? <ListKpiCards summary={summary.data} currency={currency} /> : null}
      <ListFilterBar
        status={status}
        onStatus={setStatus}
        searchInput={searchInput}
        onSearchInput={setSearchInput}
        searchLabel="Search campaigns"
      />
      {campaigns.isPending ? (
        <SkeletonRows rows={8} columns={9} />
      ) : rows.length === 0 ? (
        unfiltered ? (
          <EmptyState
            title="No campaigns yet"
            hint={canSync ? "Sync the ad account to pull data." : "Your agency is connecting your ad accounts."}
            action={
              canSync ? (
                <Button variant="ghost" disabled={enqueue.isPending} onClick={startSync}>
                  {enqueue.isPending ? "Starting…" : "Sync now"}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            title={`No ${statusFilterLabel(status).toLowerCase()} campaigns in this scope`}
            hint="Switch the status filter to widen the scope."
          />
        )
      ) : (
        <CampaignsTable campaigns={rows} />
      )}
      {!campaigns.isPending && total > 0 ? (
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
      {syncMessage ? <p className="text-sm text-volt-down">{syncMessage}</p> : null}
    </div>
  );
}
