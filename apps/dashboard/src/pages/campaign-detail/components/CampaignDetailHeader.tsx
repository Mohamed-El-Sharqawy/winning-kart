import { Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/format";
import { DateRangeControl, rangeLabel } from "@/shared/components/DateRangeControl";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { StatusDot } from "@/shared/components/StatusDot";
import type { StatusDotVariant } from "@/shared/components/StatusDot";
import type { CampaignSummary } from "../types/campaign-detail.types";

const STATUS_VARIANTS: Record<string, StatusDotVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
  pending: "warning",
  in_review: "warning",
  with_issues: "down",
};

function statusVariant(status: string): StatusDotVariant {
  return STATUS_VARIANTS[status.toLowerCase()] ?? "neutral";
}

function toWords(value: string): string {
  return value.toLowerCase().replace(/_/g, " ");
}

export interface CampaignDetailHeaderProps {
  slug: string;
  clientName: string;
  accountName?: string;
  campaign: CampaignSummary | null;
  range: DateRange;
  from: string | undefined;
  to: string | undefined;
  onApplyRange: (range: DateRange | undefined) => void;
}

export function CampaignDetailHeader({
  slug,
  clientName,
  accountName,
  campaign,
  range,
  from,
  to,
  onApplyRange,
}: CampaignDetailHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <nav className="flex flex-wrap items-center gap-2 text-[13px] text-volt-text-3">
        <Link
          to="/clients/$slug"
          params={{ slug }}
          search={{ tab: "campaigns" }}
          className="hover:text-volt-text"
        >
          {clientName}
        </Link>
        <span aria-hidden>›</span>
        {accountName ? (
          <>
            <Link
              to="/clients/$slug"
              params={{ slug }}
              search={{ tab: "campaigns" }}
              className="hover:text-volt-text"
            >
              {accountName}
            </Link>
            <span aria-hidden>›</span>
          </>
        ) : null}
        <span className="text-volt-text-2">{campaign?.name ?? "Campaign"}</span>
      </nav>
      {campaign ? (
        <h1 className="text-2xl font-semibold text-volt-text">{campaign.name}</h1>
      ) : (
        <div className="h-8 w-72 animate-pulse rounded-[8px] bg-volt-surface-2" />
      )}
      {campaign ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-volt-text-3">
          <StatusDot variant={statusVariant(campaign.status)}>{toWords(campaign.status)}</StatusDot>
          <span className="capitalize">{toWords(campaign.objective)}</span>
          {campaign.dailyBudget !== null ? (
            <span className="tabular">Daily {formatMoney(campaign.dailyBudget, campaign.currency)}</span>
          ) : null}
          {campaign.lifetimeBudget !== null ? (
            <span className="tabular">Lifetime {formatMoney(campaign.lifetimeBudget, campaign.currency)}</span>
          ) : null}
          <span className="tabular">{rangeLabel(range)}</span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <DateRangeControl from={from} to={to} onApply={onApplyRange} />
      </div>
    </header>
  );
}
