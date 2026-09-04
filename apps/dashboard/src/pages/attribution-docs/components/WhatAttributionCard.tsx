import { Card } from "@/shared/components/Card";

export function WhatAttributionCard() {
  return (
    <Card title="What attribution is">
      <div className="flex flex-col gap-3 text-sm text-volt-text-2">
        <p>
          Attribution answers one question: a person clicks an ad on Monday and buys on Thursday —
          which campaign deserves credit for that money?
        </p>
        <p>
          Every ad platform answers this internally with its own model. Meta's ROAS number is
          exactly that: Meta's internal answer to the credit question, computed by Meta, in Meta's
          favor by default. Attribution &amp; Revenue exists so you are not limited to trusting
          that one answer.
        </p>
      </div>
    </Card>
  );
}
