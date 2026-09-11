# Postgres-backed sync queue with a separate worker process

Sync work runs as durable background jobs on a Postgres-backed queue: job rows in Postgres, drained by a worker that runs as its own process from day one (same image, same database, its own compose service). This amends spec 10's "no separate queue worker; the scheduler is the worker" — the queue technology stays Postgres-only (generalizing the existing `sync_runs` queued/running pattern), so the self-hosting thesis is intact: operators run the app plus Postgres, nothing else. Runs survive browser refreshes (always true — state lives in the database) and server restarts (the worker re-kicks on boot); retry and backoff policy live per connector.

The connector-keyed log family is one source of truth: `connector_sync_log` (run lifecycle: queued/running/succeeded/partial/failed/escalated) plus `connector_sync_stages` (queryable per-stage detail) replace the ad-account-keyed `sync_runs`/`sync_jobs`, with nullable `adAccountId` context for ad-platform connectors. Every surface — Integrations center, reliability rollup, connector detail — reads only these.

## Considered Options

- **Redis + BullMQ**: rejected for V1 - adds a required operator dependency for throughput we do not project (hourly-ish connector syncs plus webhooks). Documented escape hatch if webhook volume ever demands it.
- **Worker loop inside the API process (status quo)**: rejected - queued runs orphan on every deploy, and sync load shares the API's CPU.
