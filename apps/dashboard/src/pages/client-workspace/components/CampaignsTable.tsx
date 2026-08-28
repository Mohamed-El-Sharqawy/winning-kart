import { useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import {
  campaignRowTone,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatPct,
  formatRoas,
  roasTone,
} from "@/lib/format";
import { DataTable } from "@/shared/components/DataTable";
import type { DataTableColumn } from "@/shared/components/DataTable";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { Campaign } from "../types/ad-accounts.types";
import { nextSortState, sortHeaderCell, sortRows } from "./SortHeader";
import type { SortDirection, SortState } from "./SortHeader";
import { TablePager } from "./TablePager";

const DASH = "—";
const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up", paused: "neutral", archived: "neutral",
  pending: "warning", in_review: "warning", with_issues: "down",
};

function statusVariant(status: string | null | undefined): StatusDotVariant {
  if (status === null || status === undefined) return "neutral";
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

function humanize(value: string | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLowerCase().replace(/_/g, " ");
}

type CampaignMetricKey =
  "dailyBudget" | "spend" | "revenue" | "roas" | "cpa" | "purchases" | "ctr" | "frequency";

type CampaignSortKey = "name" | CampaignMetricKey;

export interface CampaignsTableProps {
  campaigns: Campaign[];
  accountId?: string | null;
  accountName?: string | null;
  days?: number;
}

export function CampaignsTable({ campaigns, accountId, accountName, days }: CampaignsTableProps) {
  const { slug } = useParams({ from: "/clients/$slug" });
  const workspaceSearch = useSearch({ from: "/clients/$slug" });
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const resolvedDays = days ?? workspaceSearch.days ?? 30;
  const resolvedAccountId = accountId ?? workspaceSearch.account ?? null;
  const resolvedAccountName = accountName ?? workspaceSearch.accountName ?? null;
  const detailSearch = {
    days: resolvedDays,
    from: workspaceSearch.from,
    to: workspaceSearch.to,
    account: resolvedAccountId ?? undefined,
    accountName: resolvedAccountName ?? undefined,
  };
  const sorted = sortRows(campaigns, sort, (row, key) => row[key as CampaignSortKey]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const rows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const header = (key: CampaignSortKey, label: string, fallback: SortDirection = "desc") =>
    sortHeaderCell({
      label,
      active: sort !== null && sort.key === key,
      direction: sort !== null && sort.key === key ? sort.direction : fallback,
      onClick: () => setSort(nextSortState(sort, key, fallback)),
    });
  const metric = (key: CampaignMetricKey, label: string, format: (row: Campaign) => string): DataTableColumn<Campaign> => ({
    key, header: header(key, label), align: "right",
    render: (row) => <span className="tabular">{format(row)}</span>,
  });
  const columns: Array<DataTableColumn<Campaign>> = [
    {
      key: "name",
      header: header("name", "Campaign", "asc"),
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Link
            to="/clients/$slug/campaigns/$campaignId"
            params={{ slug, campaignId: row.id }}
            search={detailSearch}
            className="font-medium text-volt-text hover:underline"
          >
            {row.name}
          </Link>
          <StatusDot variant={statusVariant(row.status)}>{humanize(row.status)}</StatusDot>
        </div>
      ),
    },
    {
      key: "objective",
      header: "Objective",
      render: (row) => <span className="capitalize text-volt-text-3">{humanize(row.objective)}</span>,
    },
    metric("dailyBudget", "Budget", (row) => formatMoney(row.dailyBudget, row.currency)),
    metric("spend", "Spend", (row) => formatMoney(row.spend, row.currency)),
    metric("revenue", "Revenue", (row) => formatMoney(row.revenue, row.currency)),
    {
      key: "roas",
      header: header("roas", "ROAS"),
      align: "right",
      render: (row) => <span className={cn("tabular", roasTone(row.roas))}>{formatRoas(row.roas)}</span>,
    },
    metric("cpa", "CPA", (row) => formatMoney(row.cpa, row.currency)),
    metric("purchases", "Purchases", (row) => formatNumber(row.purchases)),
    metric("ctr", "CTR", (row) => formatPct(row.ctr)),
    metric("frequency", "Freq", (row) => formatDecimal(row.frequency)),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        rowClassName={(row) => campaignRowTone(row.roas)}
        onRowClick={(row) => {
          void navigate({
            to: "/clients/$slug/campaigns/$campaignId",
            params: { slug, campaignId: row.id },
            search: detailSearch,
          });
        }}
      />
      <TablePager
        total={sorted.length}
        page={safePage}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
      />
    </>
  );
}
