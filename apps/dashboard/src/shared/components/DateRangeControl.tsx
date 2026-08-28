import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { PRESETS, defaultRange, isIsoDate, presetKeyOf } from "@/shared/lib/date-range";
import type { DateRange, PresetKey } from "@/shared/lib/date-range";

export { defaultRange, isIsoDate, rangeLabel } from "@/shared/lib/date-range";
export type { DateRange } from "@/shared/lib/date-range";

const INPUT_CLASS =
  "rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

function chipClass(active: boolean): string {
  return active
    ? "cursor-pointer rounded-full border border-volt-primary bg-volt-primary/15 px-3 py-1 text-xs font-medium text-volt-text"
    : "cursor-pointer rounded-full border border-volt-border-2 bg-transparent px-3 py-1 text-xs text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text";
}

export interface DateRangeControlProps {
  from: string | undefined;
  to: string | undefined;
  onApply: (range: DateRange | undefined) => void;
}

export function DateRangeControl({ from, to, onApply }: DateRangeControlProps) {
  const [draft, setDraft] = useState<DateRange>(() =>
    from !== undefined && to !== undefined ? { from, to } : defaultRange(),
  );
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    setDraft(from !== undefined && to !== undefined ? { from, to } : defaultRange());
    setCustom(false);
  }, [from, to]);

  const activeKey: PresetKey = custom ? "custom" : presetKeyOf(draft);
  const invalid = draft.from > draft.to;

  function selectPreset(range: DateRange) {
    setDraft(range);
    setCustom(false);
  }

  function apply() {
    if (invalid) return;
    onApply(!custom && presetKeyOf(draft) === "month" ? undefined : { from: draft.from, to: draft.to });
  }

  return (
    <div className="flex flex-col gap-2" data-testid="date-range-control">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button key={preset.key} type="button" onClick={() => selectPreset(preset.range())} className={chipClass(activeKey === preset.key)}>
            {preset.label}
          </button>
        ))}
        <button type="button" onClick={() => setCustom(true)} className={chipClass(activeKey === "custom")}>
          Custom
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          From
          <input
            type="date"
            value={draft.from}
            data-testid="date-range-from"
            onChange={(event) => {
              if (isIsoDate(event.target.value)) {
                setDraft((current) => ({ ...current, from: event.target.value }));
                setCustom(true);
              }
            }}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
          To
          <input
            type="date"
            value={draft.to}
            data-testid="date-range-to"
            onChange={(event) => {
              if (isIsoDate(event.target.value)) {
                setDraft((current) => ({ ...current, to: event.target.value }));
                setCustom(true);
              }
            }}
            className={INPUT_CLASS}
          />
        </label>
        <Button onClick={apply} disabled={invalid}>
          Apply
        </Button>
      </div>
    </div>
  );
}
