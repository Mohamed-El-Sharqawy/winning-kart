import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import type { CreatedPat } from "../types/tokens.types";

export interface TokenRevealCardProps {
  pat: CreatedPat;
  onDismiss: () => void;
}

export function TokenRevealCard({ pat, onDismiss }: TokenRevealCardProps) {
  const [copied, setCopied] = useState(false);

  return (
    <Card title="Token created">
      <p className="text-[13px] text-volt-text-2">
        Copy this token now. It will not be shown again.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="min-w-0 flex-1 break-all rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 font-mono text-sm text-volt-text">
          {pat.token}
        </code>
        <Button
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(pat.token);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button onClick={onDismiss}>Done</Button>
      </div>
    </Card>
  );
}
