export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        border: "1px solid var(--color-volt-border)",
        borderRadius: "var(--radius-wk)",
        backgroundColor: "var(--color-volt-surface)",
      }}
    >
      <p style={{ margin: 0, color: "var(--color-volt-text)", fontWeight: 600 }}>{title}</p>
      {hint ? (
        <p style={{ margin: "6px 0 0", color: "var(--color-volt-text-3)", fontSize: 13 }}>{hint}</p>
      ) : null}
    </div>
  );
}
