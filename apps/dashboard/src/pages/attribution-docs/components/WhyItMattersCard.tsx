import { Card } from "@/shared/components/Card";

export function WhyItMattersCard() {
  return (
    <Card title="Why this matters">
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-volt-text-2">
        <li>
          <span className="font-medium text-volt-text">Meta grades its own homework.</span> Ads
          Manager ROAS is Meta crediting Meta. A first-party ledger of real orders is the only way
          to audit that number.
        </li>
        <li>
          <span className="font-medium text-volt-text">The disagreement is the product.</span> If
          Meta claims 50,000 and your ledger shows 30,000 at a 62% matched share, you can see the
          inflation instead of trusting a black box.
        </li>
        <li>
          <span className="font-medium text-volt-text">Honesty over fabrication.</span> Every order
          carries its tier, unmatched revenue stays visible, and no signal is ever invented to make
          a number look better.
        </li>
        <li>
          <span className="font-medium text-volt-text">Platform-agnostic by design.</span> The same
          ledger and tiers accept fbclid and gclid today, ttclid tomorrow — one surface across ad
          platforms, which a walled garden can never offer.
        </li>
        <li>
          <span className="font-medium text-volt-text">For the media buyer.</span> Defend budget
          reallocation with deterministic tier A evidence instead of Meta's estimate, and know
          exactly how much of the story is still unverified.
        </li>
      </ul>
    </Card>
  );
}
