import { cn } from "@/lib/cn";

export type ActionTone = "ghost" | "ghost-danger";

export function ActionButton({
  tone,
  children,
  ...props
}: { tone: ActionTone } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer rounded-wk border border-transparent px-2.5 py-1 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        tone === "ghost"
          ? "bg-transparent text-volt-text-2 hover:bg-volt-surface-2 hover:text-volt-text"
          : "bg-transparent text-volt-down hover:bg-volt-down-tint",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
