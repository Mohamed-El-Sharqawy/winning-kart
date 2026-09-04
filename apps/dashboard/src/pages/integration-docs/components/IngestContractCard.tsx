import { Card } from "@/shared/components/Card";
import { DOC_TD, DOC_TH } from "@/shared/components/doc-styles";
import { CodeBlock } from "./CodeBlock";

const FIELDS: Array<[string, string, string]> = [
  ["source_order_id", "yes", "Your store's order id, 1-200 characters. Unique per source — used for deduplication."],
  ["timestamp", "yes", "ISO 8601 date string — the order time."],
  ["value", "yes", "Number greater than 0. The order amount."],
  ["currency", "no", "Three-letter code. Defaults to AED."],
  ["status", "no", "paid, refunded, or cancelled. Stored as-is; it does not adjust totals."],
  ["customer_ref", "no", "Up to 200 characters — for example an email hash."],
  ["click_id", "no", "Object with any of fbclid, _fbp, _fbc, gclid. Any one of them gives tier A."],
  ["utm", "no", "Object with source, medium, campaign, content, term. A matching campaign gives tier B."],
  ["items", "no", "Accepted for forward compatibility — not stored and not used for matching."],
];

const REQUEST = `POST /api/revenue/ingest
Authorization: Bearer wkrev_YOUR_KEY
Content-Type: application/json`;

const BODY = `{
  "source_order_id": "ord_2041",
  "timestamp": "2026-08-15T11:20:00Z",
  "value": 9999,
  "currency": "AED",
  "click_id": { "fbclid": "IwAR2Xy..." },
  "utm": { "source": "facebook", "medium": "paid", "campaign": "Ramadan Retargeting" }
}`;

const RESPONSES = `202 { "data": { "accepted": true, "match_quality": "A", "deduped": false } }
202 { "data": { "accepted": true, "match_quality": "A", "deduped": true } }`;

const REJECTED = `401 {
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "instance": "/api/revenue/ingest",
  "code": "INVALID_INGEST_KEY"
}`;

export function IngestContractCard() {
  return (
    <Card title="The ingest contract">
      <div className="flex flex-col gap-4">
        <CodeBlock label="Request">{REQUEST}</CodeBlock>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-volt-border">
                <th className={DOC_TH}>Field</th>
                <th className={DOC_TH}>Required</th>
                <th className={DOC_TH}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map(([field, required, notes]) => (
                <tr key={field} className="border-b border-volt-border last:border-b-0">
                  <td className={`${DOC_TD} font-mono text-xs text-volt-text`}>{field}</td>
                  <td className={DOC_TD}>{required}</td>
                  <td className={DOC_TD}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock label="Example body">{BODY}</CodeBlock>
        <CodeBlock label="Responses (accepted)">{RESPONSES}</CodeBlock>
        <CodeBlock label="Rejected (problem+json)">{REJECTED}</CodeBlock>
        <p className="text-sm text-volt-text-2">
          The first response is a first-time order; the second is a replay — it returns the tier
          computed the first time with <code className="font-mono text-volt-text">deduped: true</code>{" "}
          and never double-counts. HTTP 401 means the key is missing, malformed, unknown, or
          revoked. HTTP 422 means a schema violation, for example a{" "}
          <code className="font-mono text-volt-text">value</code> of 0 or less or an unparseable{" "}
          <code className="font-mono text-volt-text">timestamp</code> — same problem+json shape with{" "}
          <code className="font-mono text-volt-text">code: "VALIDATION"</code>. Branch on the{" "}
          <code className="font-mono text-volt-text">code</code> field, never on the message.
        </p>
      </div>
    </Card>
  );
}
