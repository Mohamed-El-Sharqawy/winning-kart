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

const DASH = "—";

const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
  pending: "warning",
  in_review: "warning",
  with_issues: "down",
};

function statusVariant(status: string | null | undefined): StatusDotVariant {
  if (status === null || status === undefined) return "neutral";
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

function humanize(value: string | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLowerCase().replace(/_/g, " ");
}

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
  const resolvedDays = days ?? workspaceSearch.days ?? 30;
  const resolvedAccountId = accountId ?? workspaceSearch.account ?? null;
  const resolvedAccountName = accountName ?? workspaceSearch.accountName ?? null;
  const detailSearch = {
    days: resolvedDays,
    account: resolvedAccountId ?? undefined,
    accountName: resolvedAccountName ?? undefined,
  };
  const columns: Array<DataTableColumn<Campaign>> = [
    {
      key: "name",
      header: "Campaign",
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
    {
      key: "dailyBudget",
      header: "Budget",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.dailyBudget, row.currency)}</span>,
    },
    {
      key: "spend",
      header: "Spend",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.spend, row.currency)}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.revenue, row.currency)}</span>,
    },
    {
      key: "roas",
      header: "ROAS",
      align: "right",
      render: (row) => <span className={cn("tabular", roasTone(row.roas))}>{formatRoas(row.roas)}</span>,
    },
    {
      key: "cpa",
      header: "CPA",
      align: "right",
      render: (row) => <span className="tabular">{formatMoney(row.cpa, row.currency)}</span>,
    },
    {
      key: "purchases",
      header: "Purchases",
      align: "right",
      render: (row) => <span className="tabular">{formatNumber(row.purchases)}</span>,
    },
    {
      key: "ctr",
      header: "CTR",
      align: "right",
      render: (row) => <span className="tabular">{formatPct(row.ctr)}</span>,
    },
    {
      key: "frequency",
      header: "Freq",
      align: "right",
      render: (row) => <span className="tabular">{formatDecimal(row.frequency)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={campaigns}
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
  );
}
