import { formatMoney, formatNumber, formatRelativeTime, formatRoas } from "@/lib/format";
import { Card } from "@/shared/components/Card";
import { KpiCard } from "@/shared/components/KpiCard";
import { StatusDot, healthDotVariant } from "@/shared/components/StatusDot";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { useOverview } from "@/shared/services/overview.service";
import type { Client } from "@/shared/types/clients.types";
import { useAdAccounts } from "../services/ad-accounts.service";

export function OverviewTab({ client, range }: { client: Client; range: DateRange }) {
  const { data: overview } = useOverview(range);
  const { data: accounts, isPending: accountsPending } = useAdAccounts(client.id);
  const rollup = overview?.clients.find((row) => row.slug === client.slug) ?? null;
  const issuesByAccount = new Map((overview?.issues ?? []).map((issue) => [issue.adAccountId, issue]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Spend" value={formatMoney(rollup?.spend ?? 0, client.displayCurrency)} />
        <KpiCard label="Revenue" value={formatMoney(rollup?.revenue ?? 0, client.displayCurrency)} />
        <KpiCard label="ROAS" value={formatRoas(rollup?.roas ?? 0)} />
        <KpiCard label="Purchases" value={formatNumber(rollup?.purchases ?? 0)} />
      </div>
      <Card title="Ad account health">
        {accountsPending ? (
          <p className="text-sm text-volt-text-3">Loading ad accounts…</p>
        ) : (accounts ?? []).length === 0 ? (
          <p className="text-sm text-volt-text-3">No ad accounts yet — add one on the Ad Accounts tab.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-volt-border">
            {(accounts ?? []).map((account) => {
              const issue = issuesByAccount.get(account.id);
              return (
                <li
                  key={account.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                >
                  <StatusDot variant={healthDotVariant(account.healthState)}>{account.name}</StatusDot>
                  <span className="font-mono text-xs text-volt-text-3">{account.adAccountId}</span>
                  <span className="ml-auto text-xs text-volt-text-3">
                    Synced {formatRelativeTime(account.lastSyncAt)}
                  </span>
                  {issue?.errorHint ? (
                    <span className="w-full text-xs text-volt-down">{issue.errorHint}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
