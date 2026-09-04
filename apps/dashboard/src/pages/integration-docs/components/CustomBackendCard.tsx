import { Card } from "@/shared/components/Card";

export function CustomBackendCard() {
  return (
    <Card title="Connect a custom backend — available now">
      <div className="flex flex-col gap-3 text-sm text-volt-text-2">
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>
            <span className="font-medium text-volt-text">Generate an ingest key.</span> Open the
            client's workspace and go to the Revenue tab (sidebar: Attribution &amp; Revenue), then
            click Generate ingest key. Give the source a name (for example "Store production" or
            "ERP nightly export"). The key —{" "}
            <code className="font-mono text-volt-text">wkrev_</code> followed by 32 hexadecimal
            characters — is shown once. Only a SHA-256 hash is stored, so copy it immediately.
          </li>
          <li>
            <span className="font-medium text-volt-text">Send one POST per completed order</span>{" "}
            from your backend to the ingest endpoint with that key as a Bearer token. The full
            contract is in the next section.
          </li>
          <li>
            <span className="font-medium text-volt-text">Verify in the ledger.</span> Accepted
            orders appear in the Revenue tab's events table with their tier badge, and the matched
            share KPI climbs as tier A and B coverage improves.
          </li>
        </ol>
        <p>
          Lost the key? Generate a new one and revoke the old one from the same tab — revocation is
          confirmed by typing the source name and takes effect immediately. Any call with a revoked
          or unknown key is rejected with HTTP 401.
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Keep keys in environment variables or a secrets manager — never in client-side code or public repositories.</li>
          <li>Always send keys over HTTPS.</li>
          <li>Keys are scoped per client: one client's key cannot write to another client's ledger.</li>
        </ul>
      </div>
    </Card>
  );
}
