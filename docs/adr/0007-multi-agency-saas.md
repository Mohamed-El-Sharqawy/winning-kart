# Multi-agency tenancy is a product goal

Winning Kart becomes a public multi-agency SaaS; single-tenant operation is a phase, not the design. From day one new tables carry an `agencies` dimension: the `agencies` table exists and `Connector.agencyId` is NOT NULL. Retrofitting agency scoping onto existing tables (`users`, `clients`, `ad_accounts`, `api_tokens`) is a separate effort with its own wayfinder map, not part of the V1 platform-breadth map.

Handover order is locked by the captain: the tenancy map finishes first, then one /to-spec run covers both maps, then one /to-tickets run sequences the build tickets for both together.
