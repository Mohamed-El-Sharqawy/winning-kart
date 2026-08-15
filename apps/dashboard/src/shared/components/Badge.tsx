import { cn } from "@/lib/cn";

export type BadgeVariant = "up" | "down" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  up: "border-transparent bg-volt-up-tint text-volt-up",
  down: "border-transparent bg-volt-down-tint text-volt-down",
  neutral: "border-transparent bg-volt-surface-2 text-volt-text-2",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
      )}
    >
      {children}
    </span>
  );
}
