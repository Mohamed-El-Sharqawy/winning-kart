import { cn } from "@/lib/cn";
import { formatDecimal, formatMoney, formatNumber, formatRoas, roasTone } from "@/lib/format";
import { KpiCard } from "@/shared/components/KpiCard";
import type { CampaignPrev, CampaignSummary } from "../types/campaign-detail.types";
import { KpiDeltaChip } from "./KpiDeltaChip";

export interface CampaignKpisProps {
  campaign: CampaignSummary | null;
  prev: CampaignPrev | null;
  loading: boolean;
}

export function CampaignKpis({ campaign, prev, loading }: CampaignKpisProps) {
  if (loading || !campaign) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-[76px] animate-pulse rounded-wk bg-volt-surface-2" />
        ))}
      </div>
    );
  }

  const chip = (current: number | null, before: number | null, higherIsBetter: boolean) => (
    <KpiDeltaChip current={current} prev={before} higherIsBetter={higherIsBetter} />
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <KpiCard
        label="Spend"
        value={formatMoney(campaign.spend, campaign.currency)}
        chip={chip(campaign.spend, prev?.spend ?? null, false)}
      />
      <KpiCard
        label="Revenue"
        value={formatMoney(campaign.revenue, campaign.currency)}
        chip={chip(campaign.revenue, prev?.revenue ?? null, true)}
      />
      <div className="rounded-wk border border-volt-border bg-volt-surface px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">ROAS</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className={cn("tabular text-3xl font-semibold", roasTone(campaign.roas))}>
            {formatRoas(campaign.roas)}
          </p>
          {chip(campaign.roas, prev?.roas ?? null, true)}
        </div>
      </div>
      <KpiCard
        label="CPA"
        value={formatMoney(campaign.cpa, campaign.currency)}
        chip={chip(campaign.cpa, prev?.cpa ?? null, false)}
      />
      <KpiCard
        label="Purchases"
        value={formatNumber(campaign.purchases)}
        chip={chip(campaign.purchases, prev?.purchases ?? null, true)}
      />
      <KpiCard label="Frequency" value={formatDecimal(campaign.frequency)} />
    </div>
  );
}
