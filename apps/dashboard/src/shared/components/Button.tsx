import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost" | "danger" | "ghost-danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border-volt-primary bg-volt-primary text-volt-ground hover:border-volt-primary-strong hover:bg-volt-primary-strong",
  ghost:
    "border-transparent bg-transparent text-volt-text-2 hover:bg-volt-surface-2 hover:text-volt-text",
  danger: "border-volt-down bg-volt-down text-volt-ground hover:opacity-90",
  "ghost-danger": "border-transparent bg-transparent text-volt-down hover:bg-volt-down-tint",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-wk border px-4 py-2 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
