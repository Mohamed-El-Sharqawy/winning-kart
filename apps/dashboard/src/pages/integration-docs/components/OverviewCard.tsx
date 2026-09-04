import { Card } from "@/shared/components/Card";

export function OverviewCard() {
  return (
    <Card title="How attribution and revenue work">
      <div className="flex flex-col gap-3 text-sm text-volt-text-2">
        <p>
          Attribution &amp; Revenue answers one question: did ad spend actually produce revenue? Two
          separate surfaces feed it, and they never duplicate each other.
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <span className="font-medium text-volt-text">Meta platform-attributed revenue</span> —
            pulled from Meta insights and already visible in campaign ROAS metrics. Nothing to
            connect; Meta reports it regardless.
          </li>
          <li>
            <span className="font-medium text-volt-text">The revenue ledger</span> — orders your own
            systems send through the ingest API. This is the only surface a custom backend feeds,
            and it is what the Revenue tab shows.
          </li>
        </ul>
        <p>
          The ledger is scoped per client: keys, events, and campaign matching all belong to one
          client. Any backend that can send an HTTPS POST — a storefront, an ERP, or an automation
          script — can feed it. Every order is graded into a match tier so you can see how much of
          the ledger is actually attributed to campaigns, and how much is revenue you cannot yet
          attribute. Winning Kart never fabricates a match.
        </p>
      </div>
    </Card>
  );
}
