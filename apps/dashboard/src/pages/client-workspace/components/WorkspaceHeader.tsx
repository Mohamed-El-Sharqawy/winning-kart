import { Badge } from "@/shared/components/Badge";
import type { BadgeVariant } from "@/shared/components/Badge";
import type { Client, ClientStatus } from "@/shared/types/clients.types";

const STATUS_VARIANTS: Record<ClientStatus, BadgeVariant> = {
  active: "up",
  paused: "neutral",
  archived: "neutral",
};

export function WorkspaceHeader({ client }: { client: Client }) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-bold text-volt-text">{client.name}</h1>
      <Badge variant={STATUS_VARIANTS[client.status]}>{client.status}</Badge>
      <span className="rounded-full border border-volt-border-2 bg-volt-surface-2 px-2 py-0.5 font-mono text-xs text-volt-text-2">
        {client.displayCurrency}
      </span>
    </header>
  );
}
