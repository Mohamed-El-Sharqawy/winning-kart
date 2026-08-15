import { useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { AppShell } from "@/shared/layout/AppShell";
import { NewTokenForm } from "./components/NewTokenForm";
import { TokenRevealCard } from "./components/TokenRevealCard";
import { TokensTable } from "./components/TokensTable";
import { usePats } from "./services/tokens.service";
import type { CreatedPat } from "./types/tokens.types";

export function TokensPage() {
  const { data: pats, isPending, isError } = usePats();
  const [created, setCreated] = useState<CreatedPat | null>(null);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-volt-text">Access tokens</h1>
          <p className="mt-1 text-sm text-volt-text-3">
            Personal access tokens authenticate scripts and CI runners against the API.
          </p>
        </div>
        <NewTokenForm onCreated={setCreated} />
        {created ? <TokenRevealCard pat={created} onDismiss={() => setCreated(null)} /> : null}
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading tokens…</p>
        ) : isError ? (
          <p className="text-sm text-volt-down">Failed to load tokens.</p>
        ) : pats && pats.length > 0 ? (
          <TokensTable pats={pats} />
        ) : (
          <EmptyState
            title="No tokens yet"
            hint="Create a token to authenticate scripts against the API."
          />
        )}
      </div>
    </AppShell>
  );
}
