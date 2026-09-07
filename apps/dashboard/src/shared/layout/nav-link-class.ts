import { cn } from "@/lib/cn";

const NAV_BASE_CLASS = "rounded-wk px-3 py-1.5 text-sm transition-colors";
const NAV_ACTIVE_CLASS = "bg-volt-primary/15 font-medium text-volt-primary-strong";
const NAV_IDLE_CLASS = "text-volt-text-2 hover:bg-volt-surface-2 hover:text-volt-text";

export function navLinkClass(active: boolean): string {
  return cn(NAV_BASE_CLASS, active ? NAV_ACTIVE_CLASS : NAV_IDLE_CLASS);
}
