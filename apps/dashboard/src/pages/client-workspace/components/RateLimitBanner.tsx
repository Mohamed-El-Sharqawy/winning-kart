import { useRateLimit } from "../services/ad-accounts.service";

export function RateLimitBanner({ accountId }: { accountId: string }) {
  const { data } = useRateLimit(accountId);
  if (data === null || data === undefined) return null;
  const hottest = Math.max(data.callCountPct ?? 0, data.totalTimePct ?? 0);
  if (!data.blocked && hottest < 70) return null;
  return (
    <div
      data-testid="rate-limit-banner"
      className="rounded-wk border border-volt-border-2 bg-volt-surface-2 px-4 py-3 text-sm text-volt-text-2"
    >
      {data.blocked ? (
        <span>
          Meta is cooling down — syncing is paused. Estimated clear:{" "}
          <span className="tabular">{data.estClearMin !== null ? `~${data.estClearMin} min` : "within the hour"}</span>
          . The next sync will run automatically once the window clears.
        </span>
      ) : (
        <span>
          Meta usage is at <span className="tabular">{Math.round(hottest)}%</span> — syncs slow
          down automatically near the limit.
        </span>
      )}
    </div>
  );
}
