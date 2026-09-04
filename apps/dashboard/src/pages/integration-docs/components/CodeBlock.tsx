import { cn } from "@/lib/cn";

export interface CodeBlockProps {
  label?: string;
  className?: string;
  children: string;
}

export function CodeBlock({ label, className, children }: CodeBlockProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wider text-volt-text-3">{label}</p>
      ) : null}
      <pre className="overflow-x-auto rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 font-mono text-[13px] leading-relaxed text-volt-text">
        {children}
      </pre>
    </div>
  );
}
