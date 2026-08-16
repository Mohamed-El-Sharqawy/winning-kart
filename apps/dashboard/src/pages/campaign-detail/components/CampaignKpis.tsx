import { cn } from "@/lib/cn";
import { formatDecimal, formatMoney, formatNumber, formatRoas, roasTone } from "@/lib/format";
import { KpiCard } from "@/shared/components/KpiCard";
import type { CampaignSummary } from "../types/campaign-detail.types";

export interface CampaignKpisProps {
  campaign: CampaignSummary | null;
  loading: boolean;
}

export function CampaignKpis({ campaign, loading }: CampaignKpisProps) {
  if (loading || !campaign) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-[76px] animate-pulse rounded-[10px] bg-volt-surface-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <KpiCard label="Spend" value={formatMoney(campaign.spend, campaign.currency)} />
      <KpiCard label="Revenue" value={formatMoney(campaign.revenue, campaign.currency)} />
      <div className="rounded-[10px] border border-volt-border bg-volt-surface px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">ROAS</p>
        <p className={cn("tabular mt-2 text-3xl font-semibold", roasTone(campaign.roas))}>
          {formatRoas(campaign.roas)}
        </p>
      </div>
      <KpiCard label="CPA" value={formatMoney(campaign.cpa, campaign.currency)} />
      <KpiCard label="Purchases" value={formatNumber(campaign.purchases)} />
      <KpiCard label="Frequency" value={formatDecimal(campaign.frequency)} />
    </div>
  );
}
