import { useEffect, useState } from "react";
import { useParams, useSearch } from "@tanstack/react-router";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import {
  clearWorkspaceClient,
  writeWorkspaceClient,
} from "@/shared/lib/workspace-client";
import { useClients } from "@/shared/services/clients.service";
import type { Client } from "@/shared/types/clients.types";
import type { WorkspaceTab } from "@/routes/router";
import { AdSetsTab } from "./components/AdSetsTab";
import { AccountsTab } from "./components/AccountsTab";
import { CampaignsTab } from "./components/CampaignsTab";
import { CreativesTab } from "./components/CreativesTab";
import { OverviewTab } from "./components/OverviewTab";
import { RevenueTab } from "./components/RevenueTab";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { WorkspaceTabs } from "./components/WorkspaceTabs";
import { useAdAccounts } from "./services/ad-accounts.service";

const DAY_WINDOWS = [7, 14, 30, 90];

const SELECT_CLASS =
  "rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

export function ClientWorkspacePage() {
  const { slug } = useParams({ from: "/clients/$slug" });
  const { tab } = useSearch({ from: "/clients/$slug" });
  const { data: clients, isPending, isError } = useClients();
  const client = clients?.find((candidate) => candidate.slug === slug) ?? null;

  useEffect(() => {
    if (isPending || isError) return;
    if (client) writeWorkspaceClient({ slug: client.slug, name: client.name });
    else clearWorkspaceClient();
  }, [client, isPending, isError]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading client…</p>
        ) : isError || !client ? (
          <EmptyState title="Client not found" hint="This client does not exist or was removed." />
        ) : (
          <WorkspaceBody client={client} tab={tab} />
        )}
      </div>
    </AppShell>
  );
}

function WorkspaceBody({ client, tab }: { client: Client; tab: WorkspaceTab }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const { data: accounts, isPending: accountsPending } = useAdAccounts(client.id);
  const list = accounts ?? [];
  const selectedAccountId = accountId ?? list[0]?.id ?? null;
  const metricsTab = tab === "ad-sets" || tab === "creatives";
  const accountsReady = !accountsPending && list.length > 0;

  return (
    <>
      <WorkspaceHeader client={client} />
      <WorkspaceTabs slug={client.slug} tab={tab} />
      {metricsTab && accountsPending ? <p className="text-sm text-volt-text-3">Loading ad accounts…</p> : null}
      {metricsTab && accountsReady ? (
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
            Ad account
            <select
              value={selectedAccountId ?? ""}
              onChange={(event) => setAccountId(event.target.value)}
              className={SELECT_CLASS}
            >
              {list.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
            Window
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className={SELECT_CLASS}
            >
              {DAY_WINDOWS.map((window) => (
                <option key={window} value={window}>
                  Last {window} days
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {tab === "overview" ? <OverviewTab client={client} /> : null}
      {tab === "ad-accounts" ? <AccountsTab client={client} /> : null}
      {tab === "campaigns" ? <CampaignsTab client={client} /> : null}
      {tab === "ad-sets" && accountsReady ? (
        <AdSetsTab accountId={selectedAccountId} days={days} clientSlug={client.slug} />
      ) : null}
      {tab === "creatives" && accountsReady ? (
        <CreativesTab accountId={selectedAccountId} days={days} clientSlug={client.slug} />
      ) : null}
      {tab === "revenue" ? <RevenueTab client={client} /> : null}
      {metricsTab && !accountsPending && list.length === 0 ? (
        <EmptyState
          title="No ad accounts yet"
          hint="Add an ad account on the Ad Accounts tab, then sync it to pull metrics."
        />
      ) : null}
    </>
  );
}
