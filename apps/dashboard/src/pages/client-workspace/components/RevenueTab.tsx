import { formatMoney, formatNumber, formatPct } from "@/lib/format";
import { Badge } from "@/shared/components/Badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { KpiCard } from "@/shared/components/KpiCard";
import type { Client } from "@/shared/types/clients.types";
import { useRevenueSnapshot } from "../services/revenue.service";
import type { RevenueSummary } from "../types/revenue.types";
import { RevenueEventsTable } from "./RevenueEventsTable";
import { RevenueInfoCard } from "./RevenueInfoCard";
import { RevenueSourcesCard } from "./RevenueSourcesCard";

const MATCHED_UP_THRESHOLD = 0.6;

export function RevenueTab({ client }: { client: Client }) {
  const { data: snapshot, isPending, isError } = useRevenueSnapshot(client.id);
  const summary = snapshot?.summary ?? null;
  const matchedUp = summary !== null && summary.matchedPct >= MATCHED_UP_THRESHOLD;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total revenue (30d)"
          value={formatMoney(summary?.totalValue ?? null, summary?.currency)}
        />
        <KpiCard label="Events (30d)" value={formatNumber(summary?.count ?? null)} />
        <KpiCard
          label="Matched A+B"
          value={formatPct(summary ? summary.matchedPct * 100 : null)}
          valueClassName={matchedUp ? "text-volt-up" : undefined}
        />
        <TierChips summary={summary} />
      </div>
      <RevenueInfoCard />
      <RevenueSourcesCard clientId={client.id} />
      {isPending ? (
        <p className="text-sm text-volt-text-3">Loading revenue events…</p>
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load revenue events.</p>
      ) : snapshot && snapshot.events.length > 0 ? (
        <RevenueEventsTable events={snapshot.events} />
      ) : (
        <EmptyState
          title="No revenue ingested yet"
          hint="Generate a key and point your store at the ingest endpoint."
        />
      )}
    </div>
  );
}

function TierChips({ summary }: { summary: RevenueSummary | null }) {
  return (
    <div className="rounded-wk border border-volt-border bg-volt-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">Match tiers</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Badge variant="up">A {formatNumber(summary?.tierA.count ?? null)}</Badge>
        <Badge variant="neutral">B {formatNumber(summary?.tierB.count ?? null)}</Badge>
        <Badge variant="down">C {formatNumber(summary?.tierC.count ?? null)}</Badge>
      </div>
    </div>
  );
}
