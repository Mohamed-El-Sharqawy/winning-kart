import { Card } from "@/shared/components/Card";
import { CodeBlock } from "./CodeBlock";

const CURL = `curl -X POST "https://YOUR_DASHBOARD_HOST/api/revenue/ingest" \\
  -H "Authorization: Bearer wkrev_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_order_id": "ord_2041",
    "timestamp": "2026-08-15T11:20:00Z",
    "value": 9999,
    "currency": "AED",
    "click_id": { "fbclid": "IwAR2Xy..." },
    "utm": { "source": "facebook", "medium": "paid", "campaign": "Ramadan Retargeting" }
  }'`;

const NODE = `const response = await fetch("https://YOUR_DASHBOARD_HOST/api/revenue/ingest", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.WK_INGEST_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    source_order_id: order.id,
    timestamp: new Date(order.created_at).toISOString(),
    value: Number(order.total),
    currency: order.currency,
    click_id: order.click_id,
    utm: order.utm,
  }),
});`;

const PHP = `$ch = curl_init("https://YOUR_DASHBOARD_HOST/api/revenue/ingest");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . getenv("WK_INGEST_KEY"),
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "source_order_id" => $order["id"],
        "timestamp" => date("c", strtotime($order["created_at"])),
        "value" => (float) $order["total"],
        "currency" => $order["currency"],
        "utm" => $order["utm"] ?? null,
    ]),
    CURLOPT_RETURNTRANSFER => true,
]);
curl_exec($ch);
curl_close($ch);`;

export function CodeExamplesCard() {
  return (
    <Card title="Code examples">
      <div className="flex flex-col gap-4">
        <CodeBlock label="curl">{CURL}</CodeBlock>
        <CodeBlock label="Node">{NODE}</CodeBlock>
        <CodeBlock label="PHP">{PHP}</CodeBlock>
        <p className="text-sm text-volt-text-3">
          Replace YOUR_DASHBOARD_HOST with the host where your Winning Kart dashboard runs, and
          WK_INGEST_KEY with the key you generated in the Revenue tab.
        </p>
      </div>
    </Card>
  );
}
