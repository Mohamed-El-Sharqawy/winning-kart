# Winning Kart — Sync Hardening & Media Simplification Plan

Implementer: GLM-5.3 Flash. Work phase by phase, in order, one branch + PR per phase. Do not skip steps inside a phase. If a step is ambiguous, stop and ask through the captain instead of guessing.

## Context

The current sync pulls the full universe on every run (all campaigns/ad sets/ads + the whole creative library + 30 days of daily insights at 4 levels) inside one blocking HTTP request. Heavy clients hit Meta rate limits (`server_error` on `account_info`) and HTTP timeouts. This plan delivers: rate-limit safety, incremental syncing, a non-blocking background queue, 12-month history with date filters and period comparisons, and removes all video media.

Client size today: ~500–1,000 ads (dia-flower class). Design must scale to 5,000+ with config changes only.

## Global rules (apply to every phase)

1. Code conventions: no comments, no emojis, files under 150 lines (split before growing past that), page-locality (pages never import other pages; cross-page code goes in `src/shared/`), Tailwind Night Volt tokens (`volt-*`), `tabular-nums` on numbers.
2. API contract: success is always `{"data": ...}`; errors are RFC 9457 problem+json via `problem()` in `apps/api/src/lib/problem.ts`; empty collections are 200 `{"data":[]}`.
3. Before every commit: `bun run typecheck` and `bun run build` from repo root, both must exit 0.
4. NEVER run cypress, agent-browser, or any UI/e2e test. The captain runs e2e himself.
5. Real-Meta budget: at most ONE sync request per phase (Phase 2 allows two, spaced 5+ minutes) against dia-flower (ad account id `5053d446-56d4-4c72-a166-438240f81196`). If any Meta call returns `server_error`, STOP touching Meta for the rest of the phase and report. Never retry-loop.
6. Migrations: edit `packages/db/src/schema.ts`, then run `bun run db:generate` from repo root (writes SQL files only). NEVER run `bun run db:migrate` — the captain runs it.
7. Do not restart, kill, or otherwise manage the running API (:3000) or dashboard (:5173) servers. If a smoke needs a fresh API, note it in the PR as a step for the captain.
8. Git: one branch per phase (`phase0-remove-videos`, `phase1-rate-guardian`, etc.), commit with `phase(n): ...` messages, never force-push, never merge your own PR.
9. Phase completion ritual: push the branch, open the PR (include that phase's smoke steps as a checklist for the captain), then STOP. Do not start the next phase. The captain merges, runs any migration (`bun run db:migrate`), restarts the API, and runs the smokes himself — he will explicitly authorize the next phase. If a phase's smoke fails on his side, he will paste the output; fix on the same branch and update the PR.

Reference data (for smokes): login `POST /api/auth/login {"email":"admin@wk.test","password":"demo-pass-123"}`; dia-flower client slug `dia-flower`; ad account id `5053d446-56d4-4c72-a166-438240f81196` (Meta `act_1007555864490743`); ads endpoint `GET /api/ad-accounts/5053d446-56d4-4c72-a166-438240f81196/ads`.

---

## Phase 0 — Remove video media entirely

Goal: no video fetching, decoding, storing, or displaying anywhere. Image creatives keep thumbnail + full preview image. Video creatives get a neutral placeholder tile and keep the Ads Manager link. This alone removes two whole families of Graph calls.

Steps:

1. `apps/api/src/platforms/meta/client.ts`
   - Change the adcreatives fields string to exactly: `id,name,thumbnail_url,image_url,effective_object_store_url,title,body`
   - Delete: `getVideosByIds`, `getStoryPostsByIds`, `getObjectsByIds`, `MetaVideoRow`, `VideoDetailMap`, `MetaStoryPostRow`, `StoryPostMap`, `extractVideoId`, `VIDEO_IDS_BATCH_LIMIT`, and every field/branch referencing `video_id`, `video_source`, `video_picture`, `attachment_video_url`, `object_story_spec`, `asset_feed_spec`, `effective_object_story_id`.
   - `getCreativeDetails(actId)` reduces to: page the adcreatives edge with the fields above, build and return the id→row map. Nothing else.
   - Trim `MetaCreativeDetailRow` to the remaining fields.
2. `apps/api/src/platforms/meta/normalize.ts`
   - In `normalizeCreativeDetail`: `previewImageUrl = row.image_url ?? row.effective_object_store_url ?? null`; `previewVideoUrl` is removed from `CreativeDetailRecord`; `format = (row.image_url || row.effective_object_store_url) ? "IMAGE" : null` (video ads legitimately end up null — the UI tolerates it).
   - Delete `playableUrl` and the `extractVideoId` import.
3. `packages/db/src/schema.ts` + migration
   - Remove the `previewVideoUrl` column from the `ads` table; run `bun run db:generate` (new migration dropping the column; it is empty of data). Note in the PR that the captain must run `bun run db:migrate`.
4. `apps/api/src/modules/ad-accounts/service.ts` (`decorateAdCreatives`)
   - Skip condition simplifies to: skip a row when `thumbnailUrl !== null && bodyCopy !== null && format !== null && previewImageUrl !== null`.
   - Remove `previewVideoUrl` from the patch object and its assignment block.
5. API surface: remove `previewVideoUrl` from `apps/api/src/modules/performance/model.ts` (select + row types), `service.ts` (`AdPerformance` type and `buildAdItems`), and `apps/api/src/dto/performance.ts` (`adItemDto`).
6. Dashboard `apps/dashboard/src/pages/client-workspace/`:
   - `dto/creatives.dto.ts`, `types/creatives.types.ts`, `transformers/creatives.transformer.ts`: remove `previewVideoUrl` end to end.
   - `components/CreativeDetailModal.tsx`: delete the `<video>` branch and the VIDEO overlay badge. Media area = `previewImageUrl` full image → else `thumbnailUrl` scaled → else placeholder box with the format label. Keep the Ads Manager link exactly as is.
   - `components/CreativesGallery.tsx`: when `format === "VIDEO"`, render the placeholder tile (no `<img>`); otherwise the thumbnail as today. `format === null` keeps showing a thumbnail when one exists.
   - `apps/dashboard/src/pages/campaign-detail/components/TopCreatives.tsx`: same placeholder rule in `CreativeThumb`.
7. Acceptance:
   - Typecheck + build green.
   - `rg -n "previewVideoUrl|video_source|asset_feed_spec|attachment_video_url|getVideosByIds" apps packages` returns only migration-file matches.
   - Captain smoke (list in PR): run `bun run db:migrate`, restart API, one sync, then `GET .../ads` shows no `previewVideoUrl` key; image creatives open with full preview; video creatives show placeholder + working Ads Manager link.

---

## Phase 1 — Rate-limit guardian

Goal: know Meta usage at all times, slow down before the wall, refuse to call when blocked, and tell the user how long to wait.

New file `apps/api/src/platforms/meta/rate-limit.ts`:

- `parseRateUsage(headers: Record<string,string>): {callCountPct: number|null, totalTimePct: number|null, appPct: number|null}` — read `x-business-use-case-usage` (JSON: object keyed by business id, each with `call_count`, `total_time`, `total_cputime` percentages — take the max across businesses) and `x-app-usage` (same shape). Tolerate absent/malformed headers → all null.
- `class RateGuard`:
  - `observe(headers)` — update state from `parseRateUsage`; if `x-fb-retry-after` (seconds) is present, set `blockedUntil = now + seconds`.
  - `usage()` — the current percentages plus `updatedAt`.
  - `blocked()` — `blockedUntil > now`, OR `callCountPct >= 100`, OR `totalTimePct >= 100`.
  - `estimateClearMinutes()` — if `blockedUntil` set: `ceil(remaining seconds / 60)`. Else if blocked: if `callCountPct` is the max percentage, return `60` (long window); if `totalTimePct` is the max, return `10` (short window). Else `null`.
  - `waitMs()` — `0` when usage below `WK_META_USAGE_SOFT_LIMIT` (default 70); `WK_META_SLOWDOWN_MS` (default 400) between 70 and 85; above 85 return `60000` (the caller sleeps and re-checks, effectively pausing the stage). Read env once at module load with these defaults.
- Wire into `MetaClient.request()` in `client.ts`: before the fetch, `await sleep(this.rateGuard.waitMs())` (loop while it returns 60000 and not aborted); after the response, `this.rateGuard.observe(response.headers)`. Add a `rateGuard` instance on MetaClient and expose `get rateGuard()`.
- Persist a snapshot for the UI: in `ad-accounts/service.ts` `finalize()` (and in the stage failure path), merge into `platformPayload.rateLimit = {callCountPct, totalTimePct, blocked, estClearMin, updatedAt}` (the platformPayload merge machinery already exists in `sync`).
- New endpoint in `ad-accounts/index.ts`: `GET /api/ad-accounts/:id/rate-limit` returning `{"data": {...snapshot}}` from the stored platformPayload.
- Guard the sync trigger: at the top of `sync()`, refresh the snapshot is impossible without calling Meta, so rely on stored state — if `platformPayload.rateLimit.blockedUntil` is in the future, throw `problem(429, "RATE_LIMITED", "Meta rate limit active; retry later", ..., with estClearMin in the detail or a `meta` field)`. Never call Meta when the stored state says blocked.
- Dashboard: in `client-workspace/components/AccountsTable.tsx` and the workspace sync area (`sync-copy.data.ts` + wherever "Meta is unavailable" renders today), when the rate-limit snapshot is blocked or `callCountPct >= 70`, show: `Meta cooling down — usage {pct}%. Estimated clear ~{min} min.` Fetch the snapshot from the new endpoint (reuse the page's existing service pattern; add `rate-limit` to the ad-accounts service).
- Acceptance: typecheck + build green. Captain smoke: `GET .../rate-limit` returns a data envelope; while unblocked, values are null/0 and the sync proceeds normally.

---

## Phase 2 — Delta sync (structure, insights, decoration)

Goal: a routine sync of an already-synced account makes a small, fixed number of Graph calls instead of a full pull. Two sync smokes allowed this phase (one backfill, one incremental), spaced 5+ minutes.

2a. Structure deltas (campaigns, ad sets, ads):

1. `client.ts`: add `updated_time` to the fields of `getCampaigns`, `getAdSets`, `getAds`.
2. `packages/db/src/schema.ts`: add `platformUpdatedAt` (timestamp, nullable) to campaigns, ad_sets, and ads tables; `bun run db:generate`.
3. Sync flow per entity type in `ad-accounts/service.ts`:
   - Step 1: fetch the light list — one paged call per edge with `fields=id,updated_time,status` (this is 1–3 pages for thousands of rows).
   - Step 2: load the stored `platform_id → platform_updated_at` map from the DB (add to the model).
   - Step 3: ids whose stored `platformUpdatedAt` differs or is missing need full fetch — batch-fetch them with the root-nodes call `GET /?ids=<up to 50>&fields=<full field list>` (add `getEntitiesByIds(ids, fields)` to the client, reusing `request`). If the root `?ids=` call fails for an edge, fall back to the existing full-edge fetch and record a warning — do not hard-fail.
   - Step 4: upsert only the changed rows (existing upsert path), also writing `platformUpdatedAt`.
4. Count Graph calls: add a simple counter incremented in `MetaClient.request()`; include `graphCalls` in the sync outcome summary so phases 2/3 can prove the reduction.

2b. Insight deltas:

1. Rules (keep them exactly this simple):
   - Account level: pull from `max(lastStoredRowDate - 1, windowStart)` through today, where windowStart = `now - WK_SYNC_WINDOW_DAYS` (default 30). Late data is covered by re-pulling the last 3 days every sync.
   - Campaign/adset/ad levels: pull only the last 3 days for entities already known to the DB; for a NEW entity (no insight row ever, or newly created), pull the full window once.
2. Implementation: add model helpers that return, per level, the set of entity platform ids with their max insight date. In `service.ts`, compute per-level the list of entity ids that need the full window vs the 3-day pull, and call `getInsights` with explicit `time_range` per group (Meta accepts one range per call, so group entities by range; the insights call is per-account-edge with level filtering — keep using the account edge per level exactly as today, just with a shorter `time_range` where possible; where the API shape forces one range per call, use the union window for new entities only, and the 3-day window for the rest, i.e. at most two calls per level).
3. First sync of a fresh account: no stored rows → full window pull for all levels (today's behavior), chunked by 30-day windows when the window exceeds 30 days (needed by Phase 4).

2c. Decoration deltas: after Phase 0, decoration = image fields only. Keep the library pull (`getCreativeDetails`) but gate it on "at least one ad row is missing thumbnail/body/format/previewImageUrl", and cap decoration per run at 200 ads (`WK_DECORATE_MAX`, default 200) — remainder finishes on the next sync. Record remaining count in the sync summary.

2d. Checkpoints: while running stages, write progress into the running `sync_jobs` row `detail` as `{done, total}` where natural (pages processed, entities upserted). Phase 3 reuses this.

Acceptance: typecheck + build. Captain smoke: fresh-account sync #1 reports `graphCalls` (expected: large, e.g. 100+ for dia-flower), sync #2 five minutes later reports a dramatically smaller number (target: under 25). Both sync outcomes `ok: true`. Put both numbers in the PR.

---

## Phase 3 — Background queue + progress

Goal: `POST /sync` returns instantly; work drips in the background; the UI shows live progress; restarts are safe.

1. Migration: new table `sync_runs` (id uuid pk, ad_account_id uuid, status text: queued|running|succeeded|failed|cancelled|interrupted, progress jsonb, error text nullable, created_at, started_at nullable, ended_at nullable).
2. New file `apps/api/src/modules/ad-accounts/queue.ts`:
   - Module-level singleton `SyncQueue`: `enqueue(adAccountId)` → creates a `sync_runs` row (status queued) and returns its id; a single worker loop (concurrency 1 globally) picks the oldest queued run, marks it running, executes the existing `service.sync()` internals, updating `progress` at each stage boundary and throttled to at most one write per second; on finish marks succeeded/failed.
   - Between Graph calls the guardian (Phase 1) already paces; additionally enforce `WK_QUEUE_MIN_CALL_INTERVAL_MS` (default 300) via the same counter hook used in Phase 2.
   - Cancellation: `cancel(runId)` sets status cancelled; the worker checks between stages and stops cleanly.
   - On API boot: any `running`/`queued` rows become `interrupted`.
3. API: `POST /ad-accounts/:id/sync` now enqueues and returns 202 `{"data":{"runId": ...}}` (rate-limit guard from Phase 1 still applies first). New `GET /ad-accounts/:id/sync/runs/latest` → `{"data":{runId,status,progress,error,startedAt,endedAt}}`. New `POST /ad-accounts/:id/sync/runs/:runId/cancel`.
4. `apps/api/src/lib/sync-cron.ts`: enqueue instead of calling sync directly.
5. Dashboard sync panel (`client-workspace` sync components): Sync button calls the new endpoint, then polls `runs/latest` every 3 seconds while status is queued/running, rendering stage progress (reuse `SyncStageList`); on 202-rejection (409 RATE_LIMITED) show the Phase 1 banner with the estimate; keep the button disabled while a run is active for that account.
6. Acceptance: typecheck + build. Captain smoke: `POST /sync` responds in under 1 second with a runId; polling shows progress; a second `POST` while running does not double-enqueue (return the active runId instead).

---

## Phase 4 — 12-month history, date filters, comparisons

Zero new Meta reads at query time: once a day row is stored, all filtering and comparison is SQL. Meta is only touched by the backfill below.

4a. Backfill (writes history through the queue):
- `POST /ad-accounts/:id/backfill` with body `{"months": 12}` → enqueues a special run that pulls daily insights for the requested span in 30-day chunks, oldest first, skipping dates already stored, through the Phase 3 queue (so pacing + restart safety come free). Cap months at 24.
- Dashboard: a "Load 12 months history" action on the account sync panel with honest copy ("runs in the background, first time can take a while").

4b. Read-side date ranges:
- Performance endpoints (`/campaigns`, `/ad-sets`, `/ads`, `/campaigns/:campaignId`, `/fatigue-summary`, overview endpoints) accept `from` and `to` (ISO `YYYY-MM-DD`) in addition to `days`. Precedence: explicit `from/to` wins over `days`. Validation: `from <= to`, span ≤ 730 days, else problem 422. Internals switch to computing `since/until` once (in `performance/service.ts` parse helper) — the aggregation code already works on date windows, so this is mostly plumbing through model queries.
- Keep `days` working so existing UI/cypress fixtures stay valid.

4c. Dashboard date pickers:
- New shared component `src/shared/components/DateRangeControl.tsx`: two `<input type="date">` (From, To) + an Apply button + quick chips (`This month` (default), `Last 30 days`, `This quarter`, `This year`, `Custom`). Local state only until Apply is pressed; Apply writes `from`/`to` into the route search params (router `validateSearch` gains optional `from`/`to` parsed as ISO date strings; empty/invalid → undefined → fall back to default range = first of current month → today).
- Wire into: client workspace tabs (campaigns/ad-sets/creatives), campaign detail header area, and overview (alongside existing chips if present — chips set the same params).
- Refetch happens only when search params change (Apply). Never on typing.

4d. Comparisons (v1 scope):
- For KPI surfaces (workspace overview tab, campaign detail KPIs), the API also computes the previous equal-length window (from − span → from) and returns `prev` values next to current (e.g. `{"spend": 123, "prev": {"spend": 100}}`).
- UI: delta chips on KPI cards (`▲ 23% vs previous period`, green/red by sign, `—` when previous is null/0).
- Month-vs-month etc. is the user choosing ranges; no extra API work.

Acceptance: typecheck + build. Captain smoke: pick two ranges, confirm data changes only on Apply; KPI cards show deltas; network tab shows zero Graph/Meta traffic (only `/api/...` calls).

---

## Sizing (A today → C tomorrow)

All pacing lives in env constants with defaults sized for A/B: `WK_META_USAGE_SOFT_LIMIT` (70), `WK_META_SLOWDOWN_MS` (400), `WK_SYNC_WINDOW_DAYS` (30), `WK_DECORATE_MAX` (200), `WK_QUEUE_MIN_CALL_INTERVAL_MS` (300). Reaching size C = raising intervals / lowering soft limit, no code change. Document them in `docs/configuration.md` (append a "Sync pacing" section in Phase 3's PR).

## Deliverables checklist

Each phase ends the same way: PR opened with its smoke checklist → wait for the captain's merge and explicit go-ahead → only then start the next phase.

- Phase 0 PR: videos gone (API + DB + UI), placeholder for video creatives.
- Phase 1 PR: guardian + `/rate-limit` endpoint + cooldown banner + sync refusal while blocked.
- Phase 2 PR: deltas + `graphCalls` in sync summary (proof: sync #2 ≪ sync #1).
- Phase 3 PR: queue + instant sync + progress UI + restart safety + cron wiring + config docs.
- Phase 4 PR: backfill action + from/to API + date pickers + comparison deltas.
