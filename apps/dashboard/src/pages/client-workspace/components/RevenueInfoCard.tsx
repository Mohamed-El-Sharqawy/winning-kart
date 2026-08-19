import { Card } from "@/shared/components/Card";

export function RevenueInfoCard() {
  return (
    <Card title="Where this data comes from">
      <div className="flex flex-col gap-2">
        <ul className="flex flex-col gap-1 text-sm text-volt-text-2">
          <li>Revenue arrives through the ingest API from any custom backend or automation.</li>
          <li>Shopify and WooCommerce connectors arrive in V1.</li>
          <li>Meta-attributed revenue already appears in campaign metrics.</li>
        </ul>
        <p className="text-[13px] text-volt-text-3">
          Generate a key, then send orders from your store's backend — see{" "}
          <span className="font-mono text-volt-text-2">docs/revenue-ingest.md</span>.
        </p>
      </div>
    </Card>
  );
}
