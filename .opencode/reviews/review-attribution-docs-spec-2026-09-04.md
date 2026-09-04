# Code Review: SPEC — attribution-docs page
**Date**: 2026-09-04
**Reviewer**: @code-reviewer (spec sub-agent)
**Scope**: apps/dashboard/src/pages/attribution-docs/** (untracked), router.tsx, RevenueInfoCard.tsx, integration-docs/*, shared/doc-table.ts, routes.cy.ts; facts checked vs apps/api revenue/service.ts, meta/normalize.ts, RevenueTab.tsx, docs/revenue-ingest.md

## Summary
Page faithfully conveys the explanation (attribution question, ground truth vs estimate, two lanes, A/B/C as evidence quality, roadmap models, why-it-matters). Navigation verified. One factual error and one overstatement.

## Findings

### [SEVERITY: HIGH] — "gclid tomorrow" is false today
- **Category**: Correctness (spec item c)
- **File**: `apps/dashboard/src/pages/attribution-docs/components/WhyItMattersCard.tsx:24`
- **Issue**: "accept fbclid today and gclid or ttclid tomorrow". Code already grants tier A for gclid: `service.ts:141` `[clickIds.fbclid, clickIds._fbp, clickIds._fbc, clickIds.gclid].some(...)`; docs/revenue-ingest.md:18 lists gclid. Only ttclid is future (docs/roadmap.md:58).
- **Fix**: Change to "accept fbclid and gclid today, ttclid tomorrow."

### [SEVERITY: MEDIUM] — "provably attributed" overstates the matched share KPI
- **Category**: Correctness
- **File**: `apps/dashboard/src/pages/attribution-docs/components/PutItToWorkCard.tsx:12`
- **Issue**: "matched share KPI tells you how much of the ledger is provably attributed". KPI is matchedPct of A+B (`RevenueTab.tsx:29`; `service.ts:273` `matchedCount = tiers.A.count + tiers.B.count`), and the page itself (TwoLanesCard:43-45) calls B "probable", not proof. Self-contradiction.
- **Fix**: "…how much of the ledger is matched (tier A proven, tier B probable)."

### [SEVERITY: LOW] — C-tier wording "graded deterministically"
- **Category**: Maintainability
- **File**: `TwoLanesCard.tsx:13`
- **Issue**: "Evidence is graded deterministically" is true of the algorithm but reads as if grading proves causation; surrounding text already disclaims this. Acceptable; optional rewording.

## Verification performed (all pass)
- Nav: `RevenueInfoCard.tsx` (diff) links `/docs/attribution`; rendered by `RevenueTab.tsx:34`. Router registers `/docs/attribution` with `beforeLoad: requireAdmin` (router.tsx diff, line ~232). `OverviewCard.tsx` adds reverse link to `/docs/attribution`; `PutItToWorkCard.tsx:15` links `/docs/integrations` (registered route). Smoke test added (`routes.cy.ts` anchor `/why attribution matters/i` matches h1).
- Tier logic on page matches `service.ts:181-196` (A = any click id; B = utm.campaign exact match to client's campaign name → assigned to campaign; C recorded, credit withheld, never dropped — insertEvent runs for all tiers).
- Meta estimate claim matches `meta/normalize.ts:258` `revenue: round2(sumPurchaseMetrics(row.action_values))` feeding campaign ROAS.
- Ledger idempotency: `service.ts:174-177` dedupe `source.id:source_order_id`, `deduped: true` replay — matches "idempotent by order id".
- Roadmap disclaimer (first-touch/linear/time-decay, not shipped) present (TwoLanesCard:48-50). No scope creep found; doc-table move to `shared/` is a clean refactor per repo conventions.

## Positive Observations
Both-numbers-shown / neither-edited framing, biases-disclosed lane table, and 50k-vs-30k example all match the spec verbatim.

## Recommended Priority
1. Fix gclid claim (WhyItMattersCard).
2. Fix "provably attributed" (PutItToWorkCard).
3. Optional TwoLanesCard wording.
