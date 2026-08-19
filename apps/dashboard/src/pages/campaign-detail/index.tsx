import { useParams, useSearch } from "@tanstack/react-router";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import { useClients } from "@/shared/services/clients.service";
import { AdSetsTable } from "./components/AdSetsTable";
import { CampaignDetailHeader } from "./components/CampaignDetailHeader";
import { CampaignKpis } from "./components/CampaignKpis";
import { FunnelSection } from "./components/FunnelSection";
import { RoasChartCard } from "./components/RoasChartCard";
import { SpendRevenueChartCard } from "./components/SpendRevenueChartCard";
import { TopCreatives } from "./components/TopCreatives";
import { useCampaignAccountResolution, useCampaignDetail } from "./services/campaign-detail.service";

export function CampaignDetailPage() {
  const { slug, campaignId } = useParams({ from: "/clients/$slug/campaigns/$campaignId" });
  const { days, account, accountName } = useSearch({ from: "/clients/$slug/campaigns/$campaignId" });
  const { data: clients } = useClients();
  const clientName = clients?.find((client) => client.slug === slug)?.name ?? slug;
  const resolution = useCampaignAccountResolution(slug, campaignId, account === undefined);
  const accountId = account ?? resolution.accountId;
  const detail = useCampaignDetail(accountId, campaignId, days);
  const resolvedAccountName = accountName ?? detail.data?.accountName ?? resolution.accountName ?? null;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {accountId === null && !resolution.resolved ? (
          <p className="text-sm text-volt-text-3">Resolving ad account…</p>
        ) : accountId === null ? (
          <EmptyState
            title="Ad account missing"
            hint="Open this campaign from the client's campaigns tab to load its details."
          />
        ) : (
          <>
            <CampaignDetailHeader
              slug={slug}
              clientName={clientName}
              accountName={resolvedAccountName ?? undefined}
              campaign={detail.data?.campaign ?? null}
              days={days}
            />
            <CampaignKpis campaign={detail.data?.campaign ?? null} loading={detail.isPending} />
            {!detail.isError ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <SpendRevenueChartCard points={detail.data?.series ?? []} loading={detail.isPending} />
                <RoasChartCard points={detail.data?.series ?? []} loading={detail.isPending} />
              </div>
            ) : null}
            {detail.isError ? (
              <EmptyState
                title="Campaign unavailable"
                hint="The campaign could not be loaded. Return to the campaigns tab and try again."
              />
            ) : detail.data ? (
              <>
                <FunnelSection funnel={detail.data.funnel} />
                <AdSetsTable adSets={detail.data.adSets} />
                <TopCreatives ads={detail.data.ads} currency={detail.data.campaign.currency} />
              </>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
