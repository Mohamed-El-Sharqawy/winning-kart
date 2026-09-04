import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  const input = (
    <input
      id={id}
      className={cn(
        "w-full rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text placeholder:text-volt-text-3 focus:border-volt-primary focus:outline-none",
        className,
      )}
      {...props}
    />
  );
  if (!label) return input;
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-[13px] text-volt-text-2">
      {label}
      {input}
    </label>
  );
}
