import { useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { StatusDot, healthDotVariant } from "@/shared/components/StatusDot";
import { useRevenueSources } from "../services/revenue.service";
import type { CreatedRevenueSource, RevenueSource } from "../types/revenue.types";
import { IngestKeyReveal } from "./IngestKeyReveal";
import { RevenueSourceCreateModal } from "./RevenueSourceCreateModal";
import { RevenueSourceRevokeModal } from "./RevenueSourceRevokeModal";

export function RevenueSourcesCard({ clientId }: { clientId: string }) {
  const { data: sources, isPending, isError } = useRevenueSources(clientId);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedRevenueSource | null>(null);
  const [revoking, setRevoking] = useState<RevenueSource | null>(null);
  const list = sources ?? [];

  return (
    <div className="flex flex-col gap-4">
      {created ? <IngestKeyReveal source={created} onDismiss={() => setCreated(null)} /> : null}
      <Card
        title="Revenue sources"
        actions={<Button onClick={() => setCreating(true)}>Generate ingest key</Button>}
      >
        {isPending ? (
          <p className="text-sm text-volt-text-3">Loading revenue sources…</p>
        ) : isError ? (
          <p className="text-sm text-volt-down">Failed to load revenue sources.</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-volt-text-3">
            No revenue sources yet — generate an ingest key to start receiving events.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-volt-border">
            {list.map((source) => (
              <li
                key={source.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <StatusDot variant={healthDotVariant(source.status)}>{source.name}</StatusDot>
                <span className="ml-auto text-xs text-volt-text-3">
                  {source.lastEventAt
                    ? `Last event ${formatRelativeTime(source.lastEventAt)}`
                    : "No events yet"}
                </span>
                {source.status === "active" ? (
                  <Button variant="ghost-danger" onClick={() => setRevoking(source)}>
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {creating ? (
        <RevenueSourceCreateModal
          clientId={clientId}
          onClose={() => setCreating(false)}
          onCreated={(source) => {
            setCreating(false);
            setCreated(source);
          }}
        />
      ) : null}
      {revoking ? (
        <RevenueSourceRevokeModal
          clientId={clientId}
          source={revoking}
          onClose={() => setRevoking(null)}
        />
      ) : null}
    </div>
  );
}
