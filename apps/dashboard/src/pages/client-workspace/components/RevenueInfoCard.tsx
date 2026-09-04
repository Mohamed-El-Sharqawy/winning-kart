import { Link } from "@tanstack/react-router";
import { Card } from "@/shared/components/Card";
import { DOC_LINK_CLASS } from "@/shared/components/doc-styles";

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
          New to attribution? Read{" "}
          <Link to="/docs/attribution" className={DOC_LINK_CLASS}>
            why attribution matters
          </Link>{" "}
          for the business logic behind this tab.
        </p>
        <p className="text-[13px] text-volt-text-3">
          Generate a key, then send orders from your store's backend — the{" "}
          <Link to="/docs/integrations" className={DOC_LINK_CLASS}>
            integration guide
          </Link>{" "}
          walks through the full contract step by step.
        </p>
      </div>
    </Card>
  );
}
