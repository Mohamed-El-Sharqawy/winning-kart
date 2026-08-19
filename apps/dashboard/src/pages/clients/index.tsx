import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import { useClients } from "@/shared/services/clients.service";
import type { Client } from "@/shared/types/clients.types";
import { ClientsTable } from "./components/ClientsTable";
import { CreateClientModal } from "./components/CreateClientModal";
import { DeleteClientModal } from "./components/DeleteClientModal";
import { EditClientModal } from "./components/EditClientModal";

type ClientsModalState =
  | { kind: "create" }
  | { kind: "edit"; client: Client }
  | { kind: "delete"; client: Client };

export function ClientsPage() {
  const { data: clients, isPending, isError } = useClients();
  const [modal, setModal] = useState<ClientsModalState | null>(null);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-volt-text">Clients</h1>
          <Button onClick={() => setModal({ kind: "create" })}>Add client</Button>
        </div>
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading clients…</p>
        ) : isError ? (
          <p className="text-sm text-volt-down">Failed to load clients.</p>
        ) : clients && clients.length > 0 ? (
          <ClientsTable
            clients={clients}
            onEdit={(client) => setModal({ kind: "edit", client })}
            onDelete={(client) => setModal({ kind: "delete", client })}
          />
        ) : (
          <EmptyState
            title="No clients yet"
            hint="Clients created for the agency will appear here."
            action={<Button onClick={() => setModal({ kind: "create" })}>Add client</Button>}
          />
        )}
        {modal?.kind === "create" ? <CreateClientModal onClose={() => setModal(null)} /> : null}
        {modal?.kind === "edit" ? (
          <EditClientModal client={modal.client} onClose={() => setModal(null)} />
        ) : null}
        {modal?.kind === "delete" ? (
          <DeleteClientModal client={modal.client} onClose={() => setModal(null)} />
        ) : null}
      </div>
    </AppShell>
  );
}
