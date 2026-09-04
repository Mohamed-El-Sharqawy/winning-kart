import { AppShell } from "@/shared/layout/AppShell";
import { CodeExamplesCard } from "./components/CodeExamplesCard";
import { CustomBackendCard } from "./components/CustomBackendCard";
import { IngestContractCard } from "./components/IngestContractCard";
import { LedgerRulesCard } from "./components/LedgerRulesCard";
import { MatchTiersCard } from "./components/MatchTiersCard";
import { OverviewCard } from "./components/OverviewCard";
import { ShopifyCard } from "./components/ShopifyCard";

export function IntegrationDocsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-volt-text">Integration guide</h1>
          <p className="mt-1 text-sm text-volt-text-3">
            Connect a revenue source to close the loop between ad spend and real money — a custom
            backend today, Shopify in V1.
          </p>
        </div>
        <OverviewCard />
        <MatchTiersCard />
        <CustomBackendCard />
        <IngestContractCard />
        <LedgerRulesCard />
        <CodeExamplesCard />
        <ShopifyCard />
      </div>
    </AppShell>
  );
}
