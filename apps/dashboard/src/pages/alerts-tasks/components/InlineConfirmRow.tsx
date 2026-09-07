import { Button } from "@/shared/components/Button";

export function InlineConfirmRow({
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost-danger" disabled={pending} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
