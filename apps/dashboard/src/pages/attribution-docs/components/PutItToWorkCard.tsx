import { Link } from "@tanstack/react-router";
import { Card } from "@/shared/components/Card";
import { DOC_LINK_CLASS } from "@/shared/components/doc-styles";

export function PutItToWorkCard() {
  return (
    <Card title="Put it to work">
      <div className="flex flex-col gap-3 text-sm text-volt-text-2">
        <p>
          The value starts flowing as soon as real orders reach the ledger. Generate an ingest key
          on the Revenue tab, point the client's backend at the ingest endpoint, and aim for tier A
          coverage — the matched share KPI tells you how much of the ledger is matched, with tier A
          proven and tier B probable.
        </p>
        <p>
          <Link to="/docs/integrations" className={DOC_LINK_CLASS}>
            Open the integration guide
          </Link>{" "}
          for the key steps, the full ingest contract, and code examples.
        </p>
      </div>
    </Card>
  );
}
