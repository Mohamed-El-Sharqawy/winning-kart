# Dual auth paths: OAuth Connect plus retained token paste

Every platform that offers hosted authorization gets a one-click Connect flow as the default path (Meta via Facebook Login for Business, Google Ads, TikTok, Snapchat, Pinterest, LinkedIn, Shopify; WooCommerce via the guided `/wc-auth/v1/authorize` approval flow that delivers consumer keys server-side, replacing pasted keys). The existing paste-a-token path is retained as Meta's advanced option: a Business Manager System User token never expires, while an OAuth user token dies at 60 days without re-authorization, so the pasted system-user token remains the operationally strongest credential and OAuth is the convenience path.

## Considered Options

- **OAuth-only everywhere**: rejected - forces a 60-day re-auth grind on Meta for strictly worse tokens.
- **Paste-only (status quo)**: rejected - copy-paste secrets are the UX this platform set out to kill, and most platforms offer better.
