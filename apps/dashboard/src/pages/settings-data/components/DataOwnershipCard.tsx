import { Card } from "@/shared/components/Card";

const EXPORT_CLASS =
  "mt-4 inline-flex w-fit cursor-pointer items-center rounded-wk border border-volt-border-2 bg-volt-surface-2 px-4 py-2 text-sm font-semibold text-volt-text transition-colors hover:border-volt-primary";

export function DataOwnershipCard() {
  return (
    <Card title="Data ownership">
      <p className="text-[13px] leading-relaxed text-volt-text-2">
        Everything Winning Kart stores about your agency, as JSON. Data is yours.
      </p>
      <a href="/api/export/bundle" download className={EXPORT_CLASS}>
        Download full export
      </a>
    </Card>
  );
}
