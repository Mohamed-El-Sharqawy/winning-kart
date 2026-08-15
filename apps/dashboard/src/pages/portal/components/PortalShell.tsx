export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-volt-ground">
      <nav className="w-48 shrink-0 border-r border-volt-border bg-volt-surface p-4">
        <p className="px-2 pb-6 pt-2 text-xs font-bold tracking-[0.18em] text-volt-primary-strong">
          WINNING KART
        </p>
        <div className="flex flex-col gap-1">
          {["Dashboard", "Reports"].map((item) => (
            <a
              key={item}
              href="#"
              className="rounded-[10px] px-3 py-1.5 text-sm text-volt-text-2 transition-colors hover:bg-volt-surface-2 hover:text-volt-text"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
