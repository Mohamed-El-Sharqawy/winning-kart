import { AppShell } from "@/shared/layout/AppShell";
import { DataOwnershipCard } from "./components/DataOwnershipCard";
import { RetentionCard } from "./components/RetentionCard";

export function SettingsDataPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-volt-text">Data &amp; retention</h1>
          <p className="mt-1 text-sm text-volt-text-3">
            Control how long raw insights are kept and export everything Winning Kart stores.
          </p>
        </div>
        <RetentionCard />
        <DataOwnershipCard />
      </div>
    </AppShell>
  );
}
