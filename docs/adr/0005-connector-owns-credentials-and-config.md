# Connector owns credentials and connection config

The generalized `Connector` table (spec 13 section 2.11) is the single connection primitive: it holds the encrypted credential (`authPayloadEncrypted`, AES-256-GCM), the sync contract, and per-type connection config as a zod-validated `config` jsonb. Meta's token moves into it once (`ad_accounts.accessTokenEncrypted` relaxes to nullable, freezes as rollback insurance, drops in a V2 cleanup) rather than living on as a mirror. An ad-platform Connector is 1:N with AdAccount via an explicit nullable `ad_accounts.connector_id` FK — superseding spec 13 section 3.8's implicit platform-name lookup — because one OAuth credential (Meta Business, Google MCC, TikTok Business Center) can see many ad accounts and a client can hold more than one credential per platform. Per-account identifiers stay in `ad_accounts.platformPayload`; credential-scope identifiers live in a non-secret `platformMetadata` jsonb on Connector.

`revenue_sources` is dropped outright (no live revenue data to preserve): a revenue source is a Connector of the revenue category, with fields that need database guarantees promoted to real columns (`ingestKeyHash`, store `domain`) under partial unique indexes — one store domain may be connected once, one ingest key issued once. `revenue_events` references `connector_id` directly and keeps `clientId` denormalized.

## Considered Options

- **Meta credential stays canonical on AdAccount with a Connector mirror (spec 13 section 4.3)**: rejected - permanent dual-write and divergence risk across eight platforms.
- **Revenue source as a Connector + sidecar table (spec 13 section 2.11)**: rejected - strict 1:1 with type-varying shape; a join with no normalization benefit. Promoted unique columns cover the constraints a sidecar would have enforced.
- **AdAccount resolves its credential by (client, platform) lookup**: rejected - breaks the day one client holds two credentials on the same platform.
