import { useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import type { CreatedRevenueSource } from "../types/revenue.types";

export interface IngestKeyRevealProps {
  source: CreatedRevenueSource;
  onDismiss: () => void;
}

export function IngestKeyReveal({ source, onDismiss }: IngestKeyRevealProps) {
  const [copied, setCopied] = useState(false);

  return (
    <Card title="Ingest key created">
      <p className="text-[13px] leading-relaxed text-volt-text-2">
        Send events to{" "}
        <code className="font-mono text-volt-text">POST /api/revenue/ingest</code> with this Bearer
        key — shown once.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="min-w-0 flex-1 break-all rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 font-mono text-sm text-volt-text">
          {source.ingestKey}
        </code>
        <Button
          variant="ghost"
          onClick={() => {
            void copyTextToClipboard(source.ingestKey).then(setCopied);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button onClick={onDismiss}>Done</Button>
      </div>
    </Card>
  );
}
