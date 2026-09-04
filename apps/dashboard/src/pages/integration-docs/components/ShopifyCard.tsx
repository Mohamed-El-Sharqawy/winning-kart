import { Card } from "@/shared/components/Card";

export function ShopifyCard() {
  return (
    <Card title="Shopify — arrives in V1">
      <div className="flex flex-col gap-3 text-sm text-volt-text-2">
        <p>
          The turnkey Shopify connector is not available yet. Until it ships, the ingest API above
          is the way to get Shopify revenue into the ledger.
        </p>
        <p className="font-medium text-volt-text">What the connector will do when it lands:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            OAuth install per store with read-only scopes (read_orders, read_customers,
            read_all_orders). A client can bind multiple stores across currencies.
          </li>
          <li>
            Realtime orders/paid webhook plus a nightly reconciliation pass that catches missed
            webhooks and refunds.
          </li>
          <li>
            Automatic identity capture from landing_site, UTM parameters, and Pixel cookies, graded
            into the same A/B/C match tiers.
          </li>
          <li>
            Idempotent on shop domain plus order id, so webhook redelivery never double-counts.
          </li>
        </ul>
        <p className="font-medium text-volt-text">What you can do today:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            Run a small backend job against the Shopify Admin API that reads paid orders and posts
            each one to the ingest endpoint — the same contract as any custom backend.
          </li>
          <li>
            Capture fbclid or UTM parameters on incoming visits and store them on the order so your
            events land in tier A or B instead of C.
          </li>
        </ul>
      </div>
    </Card>
  );
}
