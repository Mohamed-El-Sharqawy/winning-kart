import { formatAed } from "@/lib/format";
import { AppShell } from "@/shared/layout/AppShell";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useClients } from "@/shared/services/clients.service";
import { KpiCard } from "./components/KpiCard";

export function OverviewPage() {
  const { displayName } = usePermissions();
  const { data: clients, isPending } = useClients();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-volt-text">
          Good morning, {displayName ?? "there"}
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Clients" value={isPending ? "—" : String(clients?.length ?? 0)} />
          <KpiCard label="Ad accounts" value="4" />
          <KpiCard label="Spend" value={formatAed(0)} meta="M1" />
          <KpiCard label="ROAS" value="—" meta="M1" />
        </div>
        <p className="text-sm text-volt-text-3">M1 connects live Meta insights.</p>
      </div>
    </AppShell>
  );
}
