import { cn } from "@/lib/cn";

export interface CardProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Card({ title, actions, className, children }: CardProps) {
  return (
    <section className={cn("rounded-wk border border-volt-border bg-volt-surface", className)}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 border-b border-volt-border px-5 py-4">
          <h2 className="text-sm font-semibold text-volt-text">{title}</h2>
          {actions}
        </header>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
