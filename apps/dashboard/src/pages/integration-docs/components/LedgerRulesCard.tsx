import { Card } from "@/shared/components/Card";

export function LedgerRulesCard() {
  return (
    <Card title="Retries, refunds, and limits">
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-volt-text-2">
        <li>
          <span className="font-medium text-volt-text">Retries are safe.</span> The deduplication
          key is the source plus source_order_id. Re-deliveries and replays after network failures
          return the original tier with deduped: true and never double-count. Retry on 5xx or
          timeout with exponential backoff.
        </li>
        <li>
          <span className="font-medium text-volt-text">Refunds are your call.</span> value must
          always be greater than 0 — negative amounts are rejected. The ledger records what you
          send: there is no netting or reversal on this side. The optional status field is stored
          as-is and does not adjust totals. To make refunds visible, send the events that represent
          your reality — for example export refund-adjusted figures and reconcile on your side.
        </li>
        <li>
          <span className="font-medium text-volt-text">Order ids are unique per source.</span> The
          same id replayed under the same source dedupes; the same id under a different source is a
          separate event.
        </li>
        <li>
          <span className="font-medium text-volt-text">Window.</span> The Revenue tab shows the last
          30 days of ingested events.
        </li>
        <li>
          <span className="font-medium text-volt-text">No duplication.</span> The ledger never
          mixes with Meta's platform-attributed revenue — that number already lives in campaign
          ROAS metrics.
        </li>
      </ul>
    </Card>
  );
}
