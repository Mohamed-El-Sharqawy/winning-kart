import { formatAed, formatNumber, formatRoas } from "@/lib/format";
import { AppShell } from "@/shared/layout/AppShell";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useOverview } from "@/shared/services/overview.service";
import { ClientsSummaryTable } from "./components/ClientsSummaryTable";
import { HealthStrip } from "./components/HealthStrip";
import { InsightsRegion } from "./components/InsightsRegion";
import { KpiCard } from "@/shared/components/KpiCard";

export function OverviewPage() {
  const { displayName } = usePermissions();
  const { data: overview, isPending, isError } = useOverview();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-volt-text">
          Good morning, {displayName ?? "there"}
        </h1>
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading portfolio…</p>
        ) : isError || !overview ? (
          <p className="text-sm text-volt-down">Failed to load overview.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <KpiCard label="Spend" value={formatAed(overview.spend)} />
              <KpiCard label="Revenue" value={formatAed(overview.revenue)} />
              <KpiCard label="ROAS" value={formatRoas(overview.roas)} valueClassName="text-volt-primary-strong" />
              <KpiCard label="CPA" value={formatAed(overview.cpa)} />
              <KpiCard label="Purchases" value={formatNumber(overview.purchases)} />
              <KpiCard
                label="Account health"
                value={`${overview.accountsHealthy}/${overview.accountsTotal}`}
              />
            </div>
            <InsightsRegion />
            <HealthStrip issues={overview.issues} accountsTotal={overview.accountsTotal} />
            <ClientsSummaryTable clients={overview.clients} />
          </>
        )}
      </div>
    </AppShell>
  );
}
