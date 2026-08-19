# Revenue ingest

This guide explains what the Revenue tab shows, how to generate an ingest key, and how to send orders from your store's backend to Winning Kart.

## What the Revenue tab shows

The Revenue tab is a ledger of orders you ingest yourself. It is fed by the Winning Kart ingest API — not by Meta and not by Shopify. Any custom backend (your store, your ERP, an automation script) can send completed orders, and they appear in the ledger within the last-30-days window.

Two clarifications that matter:

- Meta is already accounted for elsewhere: Meta's platform-attributed revenue shows up in campaign ROAS metrics through Meta insights. The Revenue tab ledger never duplicates that — it contains ingested orders only.
- Turnkey connectors (Shopify, WooCommerce) arrive in V1. Until then, ingestion is a small HTTP call from your side, described below.

Every ingested event is matched to a tier:

| Tier | Match | When it applies |
| ---- | ----- | --------------- |
| A | Click id | The event carries at least one click id (`fbclid`, `_fbp`, `_fbc`, or `gclid`). This is the strongest signal the order came from a tracked click. |
| B | UTM campaign | No click id, but `utm.campaign` matches a campaign name known for the client. The event is attributed to that campaign. |
| C | Unmatched | No click id and no matching campaign name. The order is still recorded in the ledger — it just is not attributed to any campaign. |

Tiers A and B count toward the "matched" share on the tab; tier C keeps your ledger complete even when attribution is impossible.

## Generating a key

Each client gets its own ingest keys. In the client workspace, open the Revenue tab and click Generate ingest key:

1. Give the source a name (for example "Shopify production" or "ERP nightly export").
2. Click create. The key is displayed once, in this format: `wkrev_` followed by 32 hexadecimal characters.
3. Copy it immediately. Winning Kart stores only a SHA-256 hash of the key — it cannot be shown again later. If you lose it, generate a new key and revoke the old one.

Revoking is instant: on the Revenue tab, click Revoke on the source and confirm by typing its name. Any ingest call with a revoked or unknown key is rejected with HTTP 401.

## The ingest contract

Send one HTTP POST per order:

```
POST /api/revenue/ingest
Authorization: Bearer wkrev_YOUR_KEY
Content-Type: application/json
```

URL placeholder: replace `https://YOUR_DASHBOARD_HOST` with the host where your Winning Kart dashboard runs.

Request body:

```json
{
  "source_order_id": "ord_2041",
  "timestamp": "2026-08-15T11:20:00Z",
  "value": 9999,
  "currency": "AED",
  "click_id": { "fbclid": "IwAR2Xy..." },
  "utm": { "source": "facebook", "medium": "paid", "campaign": "Ramadan Retargeting" }
}
```

Fields:

| Field | Required | Notes |
| ----- | -------- | ----- |
| `source_order_id` | yes | Your store's order id, 1-200 characters. Unique per source — used for deduplication. |
| `timestamp` | yes | ISO 8601 date string, the order time. |
| `value` | yes | Number greater than 0. The order amount. |
| `currency` | no | Three-letter code. Defaults to `AED`. |
| `click_id` | no | Object with any of `fbclid`, `_fbp`, `_fbc`, `gclid`. Presence of any one gives the event tier A. |
| `utm` | no | Object with `source`, `medium`, `campaign`, `content`, `term`. A matching `campaign` gives tier B. |

A few optional fields are also accepted: `status` (`paid`, `refunded`, or `cancelled`), `customer_ref` (up to 200 characters), and `items` (an arbitrary array). See the refunds note below for how `status` behaves.

### curl example

```bash
curl -X POST "https://YOUR_DASHBOARD_HOST/api/revenue/ingest" \
  -H "Authorization: Bearer wkrev_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_order_id": "ord_2041",
    "timestamp": "2026-08-15T11:20:00Z",
    "value": 9999,
    "currency": "AED",
    "click_id": { "fbclid": "IwAR2Xy..." },
    "utm": { "source": "facebook", "medium": "paid", "campaign": "Ramadan Retargeting" }
  }'
```

### Responses

Accepted (HTTP 202), first time the order id is seen:

```json
{ "data": { "accepted": true, "match_quality": "A", "deduped": false } }
```

Accepted (HTTP 202), replay of an order id already ingested under the same source:

```json
{ "data": { "accepted": true, "match_quality": "A", "deduped": true } }
```

Replays are safe and idempotent: the deduplication key is the source plus `source_order_id`, and a replay returns the tier computed the first time, with `deduped: true`. Retries after network failures will not double-count.

Errors:

- HTTP 401 `INVALID_INGEST_KEY` — missing, malformed, unknown, or revoked key.
- HTTP 422 `VALIDATION` — for example `value` of 0 or less, an unparseable `timestamp`, or a schema violation.

### Minimal Node snippet

```js
const response = await fetch("https://YOUR_DASHBOARD_HOST/api/revenue/ingest", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.WK_INGEST_KEY}`,
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
});
```

### Minimal PHP snippet

```php
$ch = curl_init("https://YOUR_DASHBOARD_HOST/api/revenue/ingest");
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
curl_close($ch);
```

## Refunds and cancellations

Be aware of what the ledger does and does not do:

- Sending a negative `value` with the same `source_order_id` is not supported — `value` must be greater than 0, and such calls are rejected with HTTP 422.
- The ledger records what you send. There is no netting, recalculation, or reversal logic on the Winning Kart side: totals are the sum of the positive event values you sent.
- The optional `status` field (`paid`, `refunded`, `cancelled`) is accepted and stored as-is. It does not adjust totals, and replaying the same `source_order_id` with a different `status` is deduplicated like any other replay.
- If you need refunds visible in your own reporting, send the events that represent your reality — for example, stop sending orders that are later refunded, or export refund-adjusted figures from your store and reconcile there.

## Security notes

- The key is shown once, at creation. Only a SHA-256 hash is stored server-side.
- Keys can be revoked at any time from the Revenue tab; revocation takes effect immediately.
- Keys are scoped per client. One client's key cannot write to another client's ledger.
- Treat keys like passwords: keep them in environment variables or a secrets manager, never in client-side code or public repositories, and always send them over HTTPS.
