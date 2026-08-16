export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-volt-border bg-volt-surface px-6 py-10 text-center">
      <p className="font-semibold text-volt-text">{title}</p>
      {hint ? <p className="mt-1.5 text-[13px] text-volt-text-3">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
