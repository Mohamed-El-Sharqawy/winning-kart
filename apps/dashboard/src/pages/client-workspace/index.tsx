import { useParams, useSearch } from "@tanstack/react-router";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import { useClients } from "@/shared/services/clients.service";
import { AccountsTab } from "./components/AccountsTab";
import { CampaignsTab } from "./components/CampaignsTab";
import { OverviewTab } from "./components/OverviewTab";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { WorkspaceTabs } from "./components/WorkspaceTabs";

export function ClientWorkspacePage() {
  const { slug } = useParams({ from: "/clients/$slug" });
  const { tab } = useSearch({ from: "/clients/$slug" });
  const { data: clients, isPending, isError } = useClients();
  const client = clients?.find((candidate) => candidate.slug === slug) ?? null;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading client…</p>
        ) : isError || !client ? (
          <EmptyState title="Client not found" hint="This client does not exist or was removed." />
        ) : (
          <>
            <WorkspaceHeader client={client} />
            <WorkspaceTabs slug={client.slug} tab={tab} />
            {tab === "overview" ? <OverviewTab client={client} /> : null}
            {tab === "ad-accounts" ? <AccountsTab client={client} /> : null}
            {tab === "campaigns" ? <CampaignsTab client={client} /> : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
