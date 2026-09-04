# Absence-based cleanup of remotely removed entities

The dashboard must mirror Meta's current working set: entities a client deleted or archived are entities we no longer care about, and keeping them listed costs query volume, screen clutter, and storage for nothing. Meta's listing endpoints default to hiding deleted and archived entities, so a remotely deleted ad simply stops appearing in our hourly sync — its row froze forever at its last status, showing as Active under the default filter. Fetching tombstones explicitly was rejected as unbounded accumulation at ~100k ads per account. Instead, the sync keeps reading the default listing, and after a fully successful entity sync — absence computed over the union of all pages, never per-page — entities missing from the listing are hard-deleted locally: FK cascades remove their ad sets and ads, and the same pass purges their `daily_insights` rows. Failed or partial runs skip cleanup entirely.

## Considered Options

- Absence-based hard cleanup — chosen: the DB mirrors the current working set exactly; size stays bounded; no ghost rows.
- Fetch archived/deleted via explicit `effective_status` filter — rejected: ingests tombstones forever at scale for states nobody asked to see.
- Stamp DELETED by per-page absence — rejected: a single failed page would mass-tombstone live entities.
- Accept staleness — rejected: ghost-Active rows in a monitoring product are actively misleading.

## Consequences

- ARCHIVED and DELETED vanish from the model: no enum members, no filter options, no rows.
- Entity-level metric history does not survive entity removal; the spec session verifies no rollup sum entity-level `daily_insights` rows before this ships.
- Cleanup correctness depends on the run-success guard: never run cleanup from partial syncs.
- Unknown future Meta statuses land in `UNKNOWN` and display under Inactive until mapped.
