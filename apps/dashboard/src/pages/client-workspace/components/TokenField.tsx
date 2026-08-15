import { cn } from "@/lib/cn";

export interface TokenFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function TokenField({ value, onChange, disabled, id }: TokenFieldProps) {
  return (
    <textarea
      id={id}
      rows={4}
      value={value}
      disabled={disabled}
      placeholder="Paste the system-user access token"
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-y rounded-[10px] border border-volt-border-2 bg-volt-surface-2 px-3 py-2 font-mono text-sm text-volt-text",
        "placeholder:font-sans placeholder:text-volt-text-3 focus:border-volt-primary focus:outline-none",
      )}
    />
  );
}
