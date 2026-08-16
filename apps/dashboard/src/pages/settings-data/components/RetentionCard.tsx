import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import {
  useApplyRetentionSettings,
  useRetentionSettings,
  useSaveRetentionSettings,
} from "../services/retention.service";

const MIN_DAYS = 1;
const MAX_DAYS = 3650;

export function RetentionCard() {
  const { data, isPending, isError } = useRetentionSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const save = useSaveRetentionSettings();
  const apply = useApplyRetentionSettings();
  const saved = data?.rawInsightsDays ?? null;
  const value = draft ?? (saved === null ? "" : String(saved));
  const parsed = Number.parseInt(value, 10);
  const valid = Number.isInteger(parsed) && parsed >= MIN_DAYS && parsed <= MAX_DAYS;
  const dirty = saved !== null && valid && parsed !== saved;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setNote(null);
    save.mutate(parsed);
  }

  function handleApply() {
    setNote(null);
    const confirmed = window.confirm(
      "Apply retention now? This permanently deletes raw insight rows older than the retention window.",
    );
    if (!confirmed) return;
    apply.mutate(undefined, {
      onSuccess: (result) => setNote(`Deleted ${result.deleted} stale insight rows`),
    });
  }

  return (
    <Card title="Raw insights retention">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          Raw insight rows older than this many days are deleted when retention is applied.
        </p>
        <div className="w-48">
          <Input
            label="Retention (days)"
            type="number"
            min={MIN_DAYS}
            max={MAX_DAYS}
            step={1}
            value={value}
            disabled={isPending}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        {isError ? (
          <p className="text-sm text-volt-down">Failed to load retention settings.</p>
        ) : null}
        {save.isError ? (
          <p className="text-sm text-volt-down">Failed to save retention settings.</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="ghost-danger"
            onClick={handleApply}
            disabled={apply.isPending || saved === null}
          >
            {apply.isPending ? "Applying…" : "Apply now"}
          </Button>
          {note ? <span className="text-[13px] text-volt-text-2">{note}</span> : null}
          {apply.isError ? (
            <span className="text-[13px] text-volt-down">Failed to apply retention.</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
