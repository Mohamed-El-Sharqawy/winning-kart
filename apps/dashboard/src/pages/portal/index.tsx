import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { CampaignsSection } from "./components/CampaignsSection";
import { CreativesSection } from "./components/CreativesSection";
import { PortalCharts } from "./components/PortalCharts";
import { PortalKpis } from "./components/PortalKpis";
import { PortalShell } from "./components/PortalShell";
import { PortalSkeleton } from "./components/PortalSkeleton";
import { NO_CLIENT_ASSIGNMENT, PortalApiError, usePortalOverview } from "./services/portal.service";

export function PortalPage() {
  const [days, setDays] = useState(30);
  const overview = usePortalOverview(days);
  const errorClass = overview.error instanceof PortalApiError ? overview.error.errorClass : null;
  const data = overview.data ?? null;
  const hasActivity = (data?.series ?? []).some((point) => point.spend > 0 || point.revenue > 0);

  return (
    <PortalShell clientName={data?.client.name ?? null} days={days} onDaysChange={setDays}>
      {overview.isPending ? (
        <PortalSkeleton />
      ) : errorClass === NO_CLIENT_ASSIGNMENT ? (
        <EmptyState title="Your agency is setting up your portal — check back shortly" />
      ) : overview.isError ? (
        <EmptyState
          title="Something went wrong"
          hint="Your dashboard could not be loaded."
          action={
            <Button variant="ghost" onClick={() => void overview.refetch()}>
              Try again
            </Button>
          }
        />
      ) : data ? (
        <div className="flex flex-col gap-6">
          <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">
            Your performance · last {days} days
          </p>
          {hasActivity ? (
            <>
              <PortalKpis kpis={data.kpis} />
              <PortalCharts points={data.series} />
            </>
          ) : (
            <EmptyState
              title="Your dashboard is being prepared"
              hint="Your agency is connecting your ad accounts"
            />
          )}
          <CampaignsSection campaigns={data.campaigns} />
          <CreativesSection creatives={data.creatives} />
        </div>
      ) : null}
    </PortalShell>
  );
}
