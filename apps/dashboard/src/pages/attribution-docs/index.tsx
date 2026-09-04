import { AppShell } from "@/shared/layout/AppShell";
import { PutItToWorkCard } from "./components/PutItToWorkCard";
import { TwoLanesCard } from "./components/TwoLanesCard";
import { WhatAttributionCard } from "./components/WhatAttributionCard";
import { WhatRevenueCard } from "./components/WhatRevenueCard";
import { WhyItMattersCard } from "./components/WhyItMattersCard";

export function AttributionDocsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-volt-text">Why attribution matters</h1>
          <p className="mt-1 text-sm text-volt-text-3">
            The business logic behind Attribution &amp; Revenue: what it answers, and why Meta's
            number alone cannot.
          </p>
        </div>
        <WhatAttributionCard />
        <WhatRevenueCard />
        <TwoLanesCard />
        <WhyItMattersCard />
        <PutItToWorkCard />
      </div>
    </AppShell>
  );
}
