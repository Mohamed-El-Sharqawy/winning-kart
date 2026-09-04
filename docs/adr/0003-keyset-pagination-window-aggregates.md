# Keyset pagination on window aggregates with hybrid decoration

Campaigns, ad sets, and ads are listed sorted and filtered on metrics (spend, ROAS, CTR, frequency) that are not columns but window aggregates over `daily_insights`, at up to ~100k ads per account. We paginate ads with an opaque keyset cursor `(sortValue, id)` — infinite scroll — and campaigns/ad sets with numbered offset pages; offset was rejected for ads because at 100k rows the skip cost and page drift grow linearly, and offset was accepted for the other two surfaces because their counts (hundreds to thousands) make it cheap and `total` free. Nulls sort last everywhere so zero-insights entities stay listed.

Decoration (fatigue classification, spendShare, trend deltas, cohort medians) is split: SQL computes only arithmetic — per-entity window sums, trend sums via `FILTER (where ...)`, spendShare, and per-ad-set medians via `percentile_cont` computed account-wide so medians never depend on the page — and `classifyAd` runs in TypeScript over the page's rows alone. Porting the classification thresholds to SQL was rejected: one rule definition, no drift between list rows, the fatigue summary, and campaign detail's embedded lists.

Window chrome follows the list, not the account: `fatigue-summary` (concentration banner, flag counts) and the campaigns/ad sets KPI cards accept the same filter params as their list (no paging/sort) and aggregate in SQL over the filtered set. Cursor tokens are opaque base64 `{v, id}`; requests must repeat filters, window, sort, and order, answered with `422 CURSOR_MISMATCH`/`CURSOR_INVALID` when they don't. Rows shifting during a mid-scroll sync (duplicate or skipped row at a boundary) is accepted.

## Considered Options

- Keyset cursor for ads, offset for campaigns/ad sets — chosen: matches each surface's scale; `total` is dropped from the ads response since counting 100k filtered rows per scroll is waste.
- Offset everywhere — rejected: ads pagination degrades at the target scale and no surface needs ads `total`.
- Full SQL port of fatigue classification — rejected: business rules duplicated in two languages drift silently.
- Materialize decoration at sync time — rejected: fatigue, spendShare, and medians are window-relative; the user selects the window.

## Consequences

- All three list endpoints consolidate under the performance module (paths unchanged); the campaigns list fixes today's zero-metric drop via LEFT JOIN, nulls last.
- Campaign detail keeps one payload: embedded ad sets and top-10 ads come from the shared machinery (spend desc, status Active) so behavior cannot drift from the tabs.
- Cursor validity is bound to the full filter/window/sort context, not just position.
- The MCP metrics tools keep calling the same service methods; only signatures adapt.
