import { Link } from "@tanstack/react-router";

export function RouteError({ error }: { error: unknown }) {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <div
        data-testid="route-error"
        className="w-full max-w-2xl rounded-[12px] border border-volt-border-2 bg-volt-surface p-6"
      >
        <h1 className="text-lg font-semibold text-volt-text">This page hit an error</h1>
        <p className="mt-2 text-sm text-volt-text-2">
          The rest of the app is unaffected. Use the link below to return to the overview.
        </p>
        <p className="mt-4 font-mono text-xs text-volt-coral">{name}: {message}</p>
        {stack ? (
          <pre className="mt-3 max-h-56 overflow-auto rounded-[8px] bg-volt-surface-2 p-3 font-mono text-[11px] leading-relaxed text-volt-text-3">
            {stack}
          </pre>
        ) : null}
        <Link
          to="/overview"
          className="mt-5 inline-flex rounded-[8px] border border-volt-border-2 px-4 py-2 text-sm text-volt-text hover:bg-volt-surface-2"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
