import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/components/Button";
import { useLogout } from "@/shared/services/session.service";

const DAY_OPTIONS = [7, 30, 90] as const;

export interface PortalShellProps {
  clientName: string | null;
  days: number;
  onDaysChange: (days: number) => void;
  children: React.ReactNode;
}

export function PortalShell({ clientName, days, onDaysChange, children }: PortalShellProps) {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-volt-ground">
      <header className="border-b border-volt-border bg-volt-surface px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {clientName ? (
            <p className="min-w-0 truncate text-sm font-bold uppercase tracking-[0.18em] text-volt-primary-strong">
              {clientName}
            </p>
          ) : (
            <div className="h-5 w-40 animate-pulse rounded-[6px] bg-volt-surface-2" />
          )}
          <div className="flex shrink-0 items-center gap-3">
            <select
              aria-label="Date range"
              value={days}
              onChange={(event) => onDaysChange(Number(event.target.value))}
              className="rounded-wk border border-volt-border bg-volt-surface px-3 py-1.5 text-sm text-volt-text-2"
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, { onSuccess: () => void navigate({ to: "/auth" }) })
              }
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
