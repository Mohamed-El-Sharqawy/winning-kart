import { Card } from "@/shared/components/Card";

export function WhatRevenueCard() {
  return (
    <Card title="What revenue we mean">
      <div className="flex flex-col gap-3 text-sm text-volt-text-2">
        <p>
          Real orders — the same money the client sees in their own store dashboard. There is no
          third synthetic number: the store sends each real order to the ingest API, and the
          Revenue tab ledger is Winning Kart's copy of those orders, kept idempotent by order id.
        </p>
        <p>Meta's "revenue" is different in kind, not just in value:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <span className="font-medium text-volt-text">Your ledger</span> — ground truth. Orders
            that actually happened, at the value actually charged.
          </li>
          <li>
            <span className="font-medium text-volt-text">Meta's number</span> — an estimate. Meta's
            guess at how much of that real money its ads caused, reported through the insights API.
          </li>
        </ul>
        <p>
          Both are shown. Neither is edited to match the other — the gap between them is
          information, not an error.
        </p>
      </div>
    </Card>
  );
}
