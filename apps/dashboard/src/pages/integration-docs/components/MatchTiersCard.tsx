import { Badge } from "@/shared/components/Badge";
import type { BadgeVariant } from "@/shared/components/Badge";
import { Card } from "@/shared/components/Card";
import { DOC_TD, DOC_TH } from "@/shared/components/doc-styles";

const TIERS: Array<{ tier: string; variant: BadgeVariant; signal: string; resolves: string }> = [
  {
    tier: "A",
    variant: "up",
    signal: "The order carries at least one click id: fbclid, _fbp, _fbc, or gclid",
    resolves: "Strongest signal — the order came from a tracked ad click",
  },
  {
    tier: "B",
    variant: "neutral",
    signal: "No click id, but utm.campaign matches a campaign name known for this client",
    resolves: "The order is attributed to that campaign",
  },
  {
    tier: "C",
    variant: "down",
    signal: "No click id and no matching campaign name",
    resolves: "Still recorded in the ledger — just not attributed to any campaign",
  },
];

export function MatchTiersCard() {
  return (
    <Card title="Match quality tiers">
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-volt-border">
                <th className={DOC_TH}>Tier</th>
                <th className={DOC_TH}>Signal</th>
                <th className={DOC_TH}>What it means</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((row) => (
                <tr key={row.tier} className="border-b border-volt-border last:border-b-0">
                  <td className={DOC_TD}>
                    <Badge variant={row.variant}>{row.tier}</Badge>
                  </td>
                  <td className={DOC_TD}>{row.signal}</td>
                  <td className={DOC_TD}>{row.resolves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-volt-text-2">
          <li>
            Tiers A and B count toward the matched share shown on the Revenue tab; tier C keeps the
            ledger complete when attribution is impossible.
          </li>
          <li>
            To earn tier A, capture the click id on your landing page or ad links and store it on
            the order before you ingest it.
          </li>
          <li>
            To earn tier B, tag your ad links with UTM parameters and send{" "}
            <code className="font-mono text-volt-text">utm.campaign</code> verbatim — it must match
            the campaign name exactly.
          </li>
        </ul>
      </div>
    </Card>
  );
}
