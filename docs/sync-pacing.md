# Sync pacing and rate-limit configuration

All knobs are optional environment variables with safe defaults sized for accounts up to a few thousand ads. Raise the intervals and lower the soft limit as your accounts grow.

| Variable | Default | What it controls |
| --- | --- | --- |
| `WK_META_USAGE_SOFT_LIMIT` | `70` | Meta quota usage percentage where slowdowns begin |
| `WK_META_SLOWDOWN_MS` | `400` | Sleep between Graph calls once usage is over the soft limit |
| `WK_QUEUE_MIN_CALL_INTERVAL_MS` | `300` | Minimum gap between any two Graph calls |
| `WK_SYNC_WINDOW_DAYS` | `30` | Days of daily insights pulled for a first-time sync |
| `WK_DELTA_PER_ENTITY_MAX` | `25` | Max per-entity fetches in one sync before falling back to a full edge pull |
| `WK_MEDIA_URL_TTL_DAYS` | `7` | Age (days) at which a stored media CDN URL counts as stale and is re-resolved on demand; clamped to 1-30 |

Behavior notes:

- Usage is read from Meta's own `x-business-use-case-usage` / `x-app-usage` response headers on every call, so pacing reacts to the real meter, not a guess.
- Between 70–85% usage calls slow down; above 85% the client pauses in 60-second steps and relaxes gradually until usage recovers.
- While a stored block is active, `POST /sync` refuses with `429 RATE_LIMITED` and an estimated clear time instead of hitting Meta.
- On-demand media resolution (ads list inline refresh, ad detail, `POST /ad-accounts/:id/ads/media/resolve`) goes through the account's platform adapter with the same RateGuard pacing and minimum call gap as sync. Stale-thumbnail reads batch at most 50 platform ids per Graph call; a warm cache (all URLs within TTL, not forced) performs zero Graph calls.
- Syncs run as background jobs (`sync_runs` table): `POST /sync` returns `202` with a `runId` immediately, progress is available at `GET /ad-accounts/:id/sync/runs/latest`, and runs interrupted by a restart are marked `interrupted` on boot.
