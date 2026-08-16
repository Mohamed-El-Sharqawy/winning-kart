import { formatNumber } from "@/lib/format";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";
import type { CampaignFunnel } from "../types/campaign-detail.types";

interface FunnelStage {
  label: string;
  value: number;
}

const STAGE_KEYS: Array<{ key: keyof CampaignFunnel; label: string }> = [
  { key: "impressions", label: "Impressions" },
  { key: "reach", label: "Reach" },
  { key: "clicks", label: "Clicks" },
  { key: "landingPageViews", label: "Landing page views" },
  { key: "addToCart", label: "Add to cart" },
  { key: "initiateCheckout", label: "Initiate checkout" },
  { key: "purchases", label: "Purchases" },
];

function stepConversion(previous: number, current: number): string {
  if (previous <= 0) return "—";
  return `${((current / previous) * 100).toFixed(1)}% of previous`;
}

export function FunnelSection({ funnel }: { funnel: CampaignFunnel }) {
  const stages: FunnelStage[] = STAGE_KEYS.map((stage) => ({ label: stage.label, value: funnel[stage.key] }));
  const max = funnel.impressions;

  if (stages.every((stage) => stage.value === 0)) {
    return <EmptyState title="No activity in this window" />;
  }

  return (
    <Card title="Funnel">
      <div className="flex flex-col gap-4">
        {stages.map((stage, index) => {
          const width = max > 0 ? Math.min(100, (stage.value / max) * 100) : 0;
          return (
            <div key={stage.label} className="grid grid-cols-[150px_1fr] items-center gap-x-4 sm:grid-cols-[220px_1fr_110px]">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-volt-text-2">{stage.label}</p>
                {index > 0 ? (
                  <p className="tabular text-xs text-volt-text-3">
                    {stepConversion(stages[index - 1].value, stage.value)}
                  </p>
                ) : (
                  <p className="tabular text-xs text-volt-text-3 sm:invisible">100% of previous</p>
                )}
              </div>
              <div className="h-7 overflow-hidden rounded-[6px] bg-volt-surface-2">
                <div className="h-full rounded-[6px] bg-volt-primary" style={{ width: `${width}%` }} />
              </div>
              <p className="tabular hidden text-right text-sm text-volt-text sm:block">{formatNumber(stage.value)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
