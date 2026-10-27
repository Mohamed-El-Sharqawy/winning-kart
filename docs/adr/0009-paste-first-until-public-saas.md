# Paste-first authentication until the public-SaaS phase

Credential paste is the V1 default for every marketing platform: Meta keeps its live system-user token path; Google Ads, TikTok, Snapchat, Pinterest, and LinkedIn paste refresh tokens obtained from one-off offline authorization runs and refreshed server-side by the token refresh worker; Shopify installs a custom app per client store and pastes the non-expiring Admin API token; WooCommerce stays on the guided `/wc-auth/v1/authorize` flow. In-app OAuth Connect is deferred until the product has been used with real clients and the captain decides to publish it as a public SaaS; OAuth then re-opens as a fresh wayfinder map.

This supersedes ADR 0004's default-path ordering (OAuth one-click everywhere, paste as Meta's advanced option) while keeping its dual-path mechanics: both paths remain designed for, only the default and the timing flip. It also amends ADR 0007's locked handover order: the tenancy retrofit map defers with the public-SaaS phase, and /to-spec covers the platform-breadth map alone.

## Considered Options

- **Keep ADR 0004's OAuth-first ordering**: rejected - it fronts App Reviews and public-distribution filings on a product not yet validated with real clients; the captain re-ordered on Oct 27 2026.
- **Drop OAuth entirely**: rejected - the dual-path mechanics stay. Pasted tokens on most platforms are refresh tokens whose exchange still requires app client credentials, and OAuth returns as the default when the product goes public.

## Consequences

- The token refresh worker becomes the auth lifeline: Snapchat's access token lasts 60 minutes, TikTok's 24 hours, Pinterest's refresh token dies if a 60-day rolling window is missed, and no OAuth re-connect exists as rescue. Expiry forecasting, alerts, and a manual re-paste path ship with it.
- LinkedIn carries an open question: programmatic refresh tokens may be limited to approved MDP partners; if a normal dev app cannot refresh, paste-first means a manual 60-day re-auth cycle. The LinkedIn adapter design ticket settles it.
- Platform filings shrink to dev-app creation (Google developer token plus Basic Access, TikTok, Snapchat, Pinterest Trial, LinkedIn Advertising API); Meta App Review and Shopify public review drop.
- ADR 0004 remains binding on the dual-path mechanics; where its default ordering is read, this ADR wins.
