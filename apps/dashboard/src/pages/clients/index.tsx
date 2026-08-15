import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import { useClients } from "@/shared/services/clients.service";
import { ClientsTable } from "./components/ClientsTable";

export function ClientsPage() {
  const { data: clients, isPending, isError } = useClients();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-volt-text">Clients</h1>
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading clients…</p>
        ) : isError ? (
          <p className="text-sm text-volt-down">Failed to load clients.</p>
        ) : clients && clients.length > 0 ? (
          <ClientsTable clients={clients} />
        ) : (
          <EmptyState
            title="No clients yet"
            hint="Clients created for the agency will appear here."
          />
        )}
      </div>
    </AppShell>
  );
}
