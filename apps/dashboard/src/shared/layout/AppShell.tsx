export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24, minWidth: 0 }}>{children}</main>
    </div>
  );
}

function Sidebar() {
  return (
    <nav
      style={{
        width: 232,
        flexShrink: 0,
        borderRight: "1px solid var(--color-volt-border)",
        backgroundColor: "var(--color-volt-surface)",
        padding: 16,
      }}
    >
      <span style={{ fontWeight: 700, color: "var(--color-volt-primary-strong)" }}>
        WINNING KART
      </span>
    </nav>
  );
}
