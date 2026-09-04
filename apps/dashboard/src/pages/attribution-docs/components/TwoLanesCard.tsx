import { Card } from "@/shared/components/Card";
import { DOC_TD, DOC_TH } from "@/shared/components/doc-styles";

const LANES: Array<{ lane: string; holds: string; treated: string }> = [
  {
    lane: "Platform lane",
    holds: "Meta's own claim, pulled from insights and shown verbatim in campaign ROAS.",
    treated:
      "Never recomputed. Known biases — self-credit, iOS-ATT decay, view-through inflation — are disclosed, not hidden.",
  },
  {
    lane: "First-party lane",
    holds: "The client's real orders, sent to the ingest API and graded A, B, or C per event.",
    treated:
      "Scored per order on evidence strength — deterministic for click ids, probabilistic for UTM matches. A grade of C keeps the revenue visible and withholds credit.",
  },
];

export function TwoLanesCard() {
  return (
    <Card title="Two lanes, deliberately separated">
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-volt-border">
                <th className={DOC_TH}>Lane</th>
                <th className={DOC_TH}>What it holds</th>
                <th className={DOC_TH}>How it is treated</th>
              </tr>
            </thead>
            <tbody>
              {LANES.map(({ lane, holds, treated }) => (
                <tr key={lane} className="border-b border-volt-border last:border-b-0">
                  <td className={`${DOC_TD} font-medium text-volt-text`}>{lane}</td>
                  <td className={DOC_TD}>{holds}</td>
                  <td className={DOC_TD}>{treated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-volt-text-2">
          The A/B/C tiers do not decide credit — they measure how strong the evidence is per order.
          Tier A is deterministic proof the buyer came from a tracked click. Tier B is a probable
          source, and is the one credit decision made today: the event is assigned to the matching
          campaign. Tier C keeps the money visible without inventing a story for it.
        </p>
        <p className="text-sm text-volt-text-2">
          Winning Kart fully deciding credit with its own models — first-touch, linear,
          time-decay — is on the roadmap, not shipped yet. The tiers are the foundation: those
          models can only run on order-level data with identity signals, which is exactly what the
          ledger collects.
        </p>
      </div>
    </Card>
  );
}
