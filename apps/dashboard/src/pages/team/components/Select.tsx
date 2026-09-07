import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function Select({ label, value, options, onChange, className, disabled }: SelectProps) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-[13px] text-volt-text-2", className)}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
