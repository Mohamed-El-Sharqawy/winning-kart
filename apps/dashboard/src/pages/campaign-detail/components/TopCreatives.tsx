import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { formatDecimal, formatMoney, formatRoas, roasTone } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import type { BadgeVariant } from "@/shared/components/Badge";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";
import type { CampaignAd } from "../types/campaign-detail.types";

const FATIGUE_VARIANTS: Record<string, BadgeVariant> = {
  fatiguing: "down",
  bleeding: "down",
  scale: "up",
  status_anomaly: "neutral",
};

function fatigueVariant(flag: string): BadgeVariant {
  return FATIGUE_VARIANTS[flag.toLowerCase()] ?? "neutral";
}

function CreativeThumb({ url, name, format }: { url: string | null; name: string; format: string | null }) {
  const [failed, setFailed] = useState(false);
  if ((format ?? "").toUpperCase() === "VIDEO" || !url || failed) {
    return (
      <div
        aria-hidden
        title={name}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-volt-border bg-volt-surface-2 text-[9px] font-medium uppercase tracking-wider text-volt-text-3"
      >
        Ad
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-[8px] border border-volt-border object-cover"
    />
  );
}

export interface TopCreativesProps {
  ads: CampaignAd[];
  currency: string;
  slug: string;
  campaignId: string;
  campaignName: string;
  account: string | undefined;
  accountName: string | undefined;
  from: string | undefined;
  to: string | undefined;
  onOpen: (adId: string) => void;
}

export function TopCreatives({
  ads,
  currency,
  slug,
  campaignId,
  campaignName,
  account,
  accountName,
  from,
  to,
  onOpen,
}: TopCreativesProps) {
  if (ads.length === 0) {
    return <EmptyState title="No creatives in this window" hint="Top creatives appear once the campaign has spend." />;
  }

  const seeAllSearch = {
    tab: "creatives" as const,
    campaign: campaignId,
    campaignName,
    account,
    accountName,
    from,
    to,
  };

  return (
    <Card title="Top creatives">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end gap-6 text-[11px] font-medium uppercase tracking-wider text-volt-text-3">
          <span className="w-24 text-right">Spend</span>
          <span className="w-16 text-right">ROAS</span>
          <span className="w-12 text-right">Freq</span>
        </div>
        <div className="flex flex-col divide-y divide-volt-border">
          {ads.map((ad) => (
            <div
              key={ad.id}
              role="button"
              tabIndex={0}
              aria-label={`Open ${ad.name}`}
              onClick={() => onOpen(ad.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(ad.id);
                }
              }}
              className="flex cursor-pointer items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-volt-surface-2 focus-visible:outline focus-visible:outline-volt-primary"
            >
              <CreativeThumb url={ad.thumbnailUrl} name={ad.name} format={ad.format} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-volt-text">{ad.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs capitalize text-volt-text-3">{(ad.format ?? "").toLowerCase().replace(/_/g, " ")}</span>
                  {ad.fatigue ? (
                    <Badge variant={fatigueVariant(ad.fatigue.flag)}>
                      <span title={ad.fatigue.reason}>{ad.fatigue.flag.toLowerCase().replace(/_/g, " ")}</span>
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-6">
                <span className="tabular w-24 text-right text-sm text-volt-text-2">
                  {formatMoney(ad.spend, currency)}
                </span>
                <span className={cn("tabular w-16 text-right text-sm", roasTone(ad.roas))}>
                  {formatRoas(ad.roas)}
                </span>
                <span className="tabular w-12 text-right text-sm text-volt-text-2">
                  {formatDecimal(ad.frequency, 1)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Link
            to="/clients/$slug"
            params={{ slug }}
            search={seeAllSearch}
            className="text-[13px] text-volt-text-3 transition-colors hover:text-volt-text"
          >
            See all creatives
          </Link>
        </div>
      </div>
    </Card>
  );
}
