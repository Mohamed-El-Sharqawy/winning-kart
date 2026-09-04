# 00 - Market Research & Competitive Analysis

Status: DRAFT (crewmate done, pending review) · Scope: framing · Source code untouched.

## Executive Summary

- The "marketing integration / ads management / reporting / analytics for agencies" space fragments across five distinct clusters (ads management & automation, agency reporting & client portals, ecommerce attribution, creative intelligence, and self-hosted/open-source marketing suites) and **no single incumbent covers all five**; most do one well and partner weakly for the rest.
- **Data ownership is the structural gap.** Outside Postiz, Mixpost, Metabase, and Huginn-class stacks, every meaningful ads-management or attribution incumbent we verified (Madgicx, Birch/Revealbot, AgencyAnalytics, Whatagraph, Triple Whale, Northbeam, Improvado, Hunch, Skai, Smartly.io, Marin, Foreplay, AdCreative.ai, Databox) is **cloud-only SaaS**. None offer a true self-hosted production deployment for an operator-owned Postgres.
- **Pricing is uniformly hostile to small agencies**: incumbents price by ad spend (Madgicx, Birch, Triple Whale, Northbeam), per client (AgencyAnalytics $20/client/mo), or per source-credit with annual contracts (Whatagraph from €699/mo). A 15-client UAE agency typically faces $300–$1,500/mo before adding attribution or creative tooling.
- **MCP / programmatic API access is the new differentiator** — AgencyAnalytics, Improvado, Foreplay, Postiz, Databox, and Madgicx all announced MCP servers in 2025–2026. Winning Kart already ships MCP tokens today, which is rare and forward-compatible.
- **Winning Kart's defensible position is the intersection no incumbent occupies**: self-hosted, operator-owned data, agency-first multi-client hierarchy, Meta-first-extensible, and a premium paper-ledger UX that the reporting cluster uniformly lacks. The opportunity is real but the buildout (planning, attribution, creative intelligence) is wide.

---

## 1. Market Segmentation

### Cluster A — Ads Management & Automation
Examples: [Madgicx](https://madgicx.com/pricing), [Birch (ex-Revealbot)](https://revealbot.com/pricing), AdScale, Wask, Sprinter, [Hunch](https://www.hunchads.com/), [Smartly.io](https://www.smartly.io/), [Marin (MarinOne)](https://www.marinsoftware.com/), [Skai (ex-Kenshoo)](https://skai.io/), Adomik. (AdEspresso was sunset by Hootsuite — date unverified, see §8.)
- **Does well**: campaign launch, automated rules, audience building, cross-channel orchestration, creative generation at scale.
- **Typical customer**: in-house performance marketer or branded agency team managing $10k–$1M+/mo in spend.
- **Pricing model**: tiered by monthly ad spend (Madgicx, Birch) or enterprise demo-only (Smartly, Skai, Marin, Hunch).
- **Boundary**: they execute but report weakly; attribution is usually platform-reported, not independent; client portal UX is an afterthought.

### Cluster B — Agency Reporting & Client Portals
Examples: [AgencyAnalytics](https://www.agencyanalytics.com/pricing), [Whatagraph](https://www.whatagraph.com/pricing), [Databox](https://databox.com/pricing), ReportGarden, NinjaCat, Swydo, [Improvado](https://improvado.io/pricing), Adriel, Datorama (Salesforce Marketing Intelligence).
- **Does well**: pull data from 60–130+ sources, schedule white-labelled PDFs, give clients a login, automate weekly digests.
- **Typical customer**: agency account manager outputting client deliverables.
- **Pricing model**: per-client (AgencyAnalytics $20/client/mo annually), per source-credit (Whatagraph from €699/mo for 50 sources), per-seat + data-source overage (Databox Pro $159/mo then $5.60/source), or enterprise custom (Improvado, NinjaCat).
- **Boundary**: read-only. They cannot pause a campaign, manage a budget, or surface creative-level fatigue as an action. Black-box "AI insights" are increasingly bolted on but rarely actionable.

### Cluster C — Ecommerce Ad Attribution / Analytics
Examples: [Triple Whale](https://www.triplewhale.com/pricing), [Northbeam](https://www.northbeam.io/pricing), Lifesight, Prescient AI.
- **Does well**: multi-touch attribution, marketing mix modelling (MMM), incrementality testing, identity resolution, post-purchase surveys; positions as the "trusted source of truth" against platform-reported numbers.
- **Typical customer**: DTC ecommerce brand spending $50k+/mo, Shopify-first.
- **Pricing model**: tiered by tracked revenue or media spend (Triple Whale Starter $179/mo annually through Enterprise custom; Northbeam Starter from $1,500/mo, Pro/Enterprise custom for $250k+/mo spend).
- **Boundary**: ecommerce-only, Shopify-centric; thin on service of *agencies* (multi-client hierarchy is grafted on); opaque model internals; not self-hosted.

### Cluster D — Creative Intelligence
Examples: [Foreplay](https://foreplay.co/pricing), [AdCreative.ai](https://www.adcreative.ai/), Motion, Sweepy, AdRapid.
- **Does well**: ad-library competitor swipe files, creative scoring, AI generation, performance tagging, fatigue detection.
- **Typical customer**: creative strategist + performance marketer pairing.
- **Pricing model**: per-seat + brand-tier (Foreplay Basic $49/mo, Workflow $149/mo, Agency $389/mo annually); per-credit (AdCreative.ai — pricing tiers unverified in this research).
- **Boundary**: standalone. Almost no reporting tool and almost no execution tool integrates creative intelligence natively; agencies stitch this on.

### Cluster E — Self-Hostable / Open-Source / Data-Ownership-Oriented
Examples: [Postiz](https://postiz.com/pricing), Mixpost, [Metabase](https://www.metabase.com/pricing), Huginn, n8n-based stacks.
- **Does well**: data ownership, on-prem deployment, no per-seat explosion, GDPR/PDPL-aligned residency, full audit control.
- **Typical customer**: privacy-conscious operator, technical founder, in-house platform team.
- **Pricing model**: open-core (Postiz OSS free, managed tiers $29–$99/mo; Metabase OSS free, cloud $100–$575/mo; Mixpost similar).
- **Boundary**: **None of these are ads-analytics tools for agencies.** Postiz and Mixpost handle organic social scheduling; Metabase is generic BI; Huginn is agent automation. They all require the operator to build the ads/marketing layer themselves. **This is the precise void Winning Kart fills.**

---

## 2. Incumbent Feature/Benefit Table

| Name | Primary category | Hosting | Platforms | Standout strength | Notable gap | Entry pricing (verified) | Data ownership |
|---|---|---|---|---|---|---|---|
| [Madgicx](https://madgicx.com/pricing) | Ads mgmt + analytics | Cloud-only | Meta-strong, Google, TikTok, GA4, Shopify | All-in-one "Ecom Ad Cloud"; AI Marketer; Tracking Pro S2S | Price gated by spend; agency hierarchy thin; no self-host | Gated (sized to ad spend); Tracking Pro $49/mo | Vendor-hosted; export only |
| [Birch / Revealbot](https://revealbot.com/pricing) | Ads automation | Cloud-only | Meta, Google, Snapchat, TikTok | Mature automated rules, audience builder, launcher | No client portal; no attribution; no creative intelligence | Essential $49/mo, Pro $99/mo, Enterprise custom | Vendor-hosted only |
| [Hunch](https://www.hunchads.com/) | Creative automation | Cloud-only | Meta, Snap, TikTok | Best-in-class dynamic creative (DPA/CPV), hyper-local scale | Demo-only pricing; no client portal; agency brand layer light | Custom (demo) — unverified | Vendor-hosted only |
| [Smartly.io](https://www.smartly.io/) | Enterprise ads (creative+media+intelligence) | Cloud-only | Meta, Google, Pinterest, CTV, etc. | Synapse AI, cross-channel orchestration, brand-grade creative | Enterprise-only; small agency unviable | Custom (demo) — unverified | Vendor-hosted only |
| [Skai (ex-Kenshoo)](https://skai.io/) | Enterprise commerce media | Cloud-only | Search, Social, Retail Media, 300+ publishers | Celeste AI agent; omnichannel + retail media depth | Enterprise-only; complex onboarding | Custom (demo) — unverified | Vendor-hosted only |
| [Marin (MarinOne)](https://www.marinsoftware.com/) | Enterprise ads mgmt | Cloud-only | Search, Social, Retail | Recently acquired by Zax Capital, AI-first roadmap reboot | Uncertain product direction post-acquisition | Custom (demo); 30-day free trial | Vendor-hosted only |
| [AgencyAnalytics](https://www.agencyanalytics.com/pricing) | Agency reporting | Cloud-only | 85+ integrations | Best agency ergonomics: per-client flat $20, client portal, white-label, MCP for ChatGPT/Claude | Read-only; no execution; no attribution; cost scales linearly with roster | $20 / client / mo (annual) | Vendor-hosted; export only |
| [Whatagraph](https://www.whatagraph.com/pricing) | Agency reporting | Cloud-only (EU DC option) | 50+ sources | EU data centre; source groups/blends; strong governance | Price floor high; per-credit overage; no execution | Max from €699/mo (50 credits, annual) | Vendor-hosted; BigQuery/Looker export on Prime |
| [Databox](https://databox.com/pricing) | BI + reporting | Cloud-only | 130+ sources, PostgreSQL, BigQuery | 15-min sync; MCP server; goals/forecasting/OKRs | Per-data-source overage; not ads-specific; weak creative layer | Free; Analyst $64/mo; Pro $159/mo; Growth $399/mo (annual) | Vendor-hosted; DB connectors |
| [Improvado](https://improvado.io/pricing) | Data pipeline + AI agent | Cloud-only (warehouse-optional) | 500+ sources, MCP servers | "Data Ownership" as productised pillar; MCP-first AI agent; agencies focus | Mid-market+ TCO; no execution layer | Free; MCP Only $100/mo; Advanced/Enterprise custom | Push to client warehouse (BigQuery/Snowflake/Redshift) |
| [Triple Whale](https://www.triplewhale.com/pricing) | Ecom attribution | Cloud-only | Meta, Google, TikTok, Amazon, Shopify, etc. | Triple Pixel MTA, Moby AI, MMM on Enterprise; mature ecom suite | Ecommerce-only; agency layer grafted; not self-hosted | Free; Starter $179/mo; Advanced $259/mo; Professional $749/mo (annual) | Vendor-hosted; Data Platform warehouse |
| [Northbeam](https://www.northbeam.io/pricing) | Ecom attribution (MTA/MMM) | Cloud-only | Meta, Google, TikTok, etc. | Deterministic view-through, Apex conversion enrichment | Price floor excludes small agencies; Shopify-leaning | Starter from $1,500/mo; Pro/Enterprise custom | Vendor-hosted only |
| [Foreplay](https://foreplay.co/pricing) | Creative intelligence | Cloud-only | Meta, TikTok, LinkedIn, YouTube ad libraries | Swipe File + Discovery + Spyder competitor tracking + Lens analytics + MCP | No execution; no spend-level reporting; standalone | Basic $49/mo; Workflow $149/mo; Agency $389/mo (annual) | Vendor-hosted only |
| [Postiz](https://postiz.com/pricing) | Self-hosted social scheduling | **Self-hosted OSS** + managed | 30+ organic social channels | True self-host; MCP + N8N nodes; transparent pricing | **No paid-ads management, no attribution, no spend analytics** | OSS free; managed $29–$99/mo | **Full operator ownership (self-host)** |
| [Metabase](https://www.metabase.com/pricing) | Self-hosted BI | **Self-hosted OSS** + cloud | Any DB | Dashboards, SQL, embedding, white-label; mature | Generic BI; no ads connectors out-of-box; no agency hierarchy | OSS free; Starter $100/mo; Pro $575/mo; Ent from $20k/yr | **Full operator ownership (self-host)** |

---

## 3. Gap Analysis (ranked by opportunity for Winning Kart)

1. **Self-hosted ads-analytics with managed-SaaS polish — the single biggest opening.** Every verified ads/attribution/reporting incumbent is cloud-only. The only self-hostable marketing suites (Postiz, Mixpost) are organic-social, not paid-ads. Metabase is generic BI. **No incumbent ships a self-hosted Meta Ads performance dashboard with an agency+client hierarchy.** This is Winning Kart's wedge.
2. **Transparent attribution vs black-box AI.** Madgicx "AI Marketer", Triple Whale "Moby", Northbeam Apex, Smartly Synapse, Skai Celeste all hide their model internals. Agencies that need to *defend* numbers to clients are forced to trust the vendor. Winning Kart can publish exactly what it pulls from Meta Marketing API, what window it uses, and what calculation produced each KPI — a defensible "show your work" posture.
3. **Client portal UX quality.** AgencyAnalytics, Whatagraph, Databox portals are functional but generic — "dashboard with a login". The paper-ledger premium aesthetic (DESIGN.md) gives clients a *report they trust at a glance* and gives the agency a visible quality signal. This is hard to copy and uniquely Winning Kart's.
4. **Unified planning + execution + reporting.** Cluster A does execution; Cluster B does reporting; Cluster C does attribution; Cluster D does creative; Cluster E does hosting. **No one unifies goal→budget→strategy→campaigns→report→plan-vs-actual.** The spec's section 08 (Marketing Plans) and 09 (Tasks/Alerts/Insights) directly occupy this void.
5. **Pricing wall for small agencies/freelancers.** Per-client and per-spend pricing excludes the captain's external freelancer/agency client segment. Whatagraph's floor (€699/mo) and Northbeam's ($1,500/mo) are unreachable; AgencyAnalytics' linear per-client model punishes roster growth. A flat or per-agency model is a structural wedge.
6. **Regional / MENA fit.** Verified incumbents bill in USD/EUR/GBP. None surface AED as native, none ship an Arabic locale, none optimise for Asia/Dubai, and UAE-relevant payment methods (cards, local gateways) are absent. For a UAE agency serving UAE/MENA clients, that is a daily friction.
7. **Creative intelligence integrated, not separate.** Foreplay/AdCreative.ai/Motion are all standalone SaaS subscriptions. Integrating creative-level performance, fatigue detection, and swipe-file import into the same operator surface as spend/ROAS collapses two tools into one.
8. **API/MCP openness.** AgencyAnalytics, Improvado, Foreplay, Postiz, Databox all shipped MCP servers in 2025–2026. **Winning Kart already has MCP API tokens in production today** — a forward-compatible moat that lets the captain's automation (and his clients' automation) read and manage ad data programmatically.

---

## 4. Hosting-Model Split

### Managed SaaS (cloud-only)
Madgicx, Birch, Hunch, Smartly.io, Skai, Marin, AgencyAnalytics, Whatagraph, Databox, Improvado, Triple Whale, Northbeam, Foreplay, AdCreative.ai.
- **Pros**: zero maintenance, instant onboarding, vendor-managed Meta API scopes/refreshes, SOC 2 / GDPR covered, multi-tenant scale.
- **Cons**: no data ownership; data residency constrained to vendor regions (Whatagraph EU DC is the partial exception); recurring subscription TCO compounds; per-client/per-spend pricing floors; vendor lock-in; pricing increases as agency grows.

### Self-hosted / Open-source
Postiz, Mixpost, Metabase, Huginn, n8n stacks.
- **Pros**: full data ownership; PDPL/GDPR/UAE-data-residency alignment; flat TCO; no per-seat explosion; audit control; survives vendor shutdowns (cf. AdEspresso sunset).
- **Cons**: operator carries deployment, backups, Meta API scope renewals, OS/DB patching, upgrade discipline; OSS projects in this space do not cover paid-ads analytics (Postiz/Mixpost are organic-social only).

### Where Winning Kart sits
**Self-hosted, operator-owned, but with the UX polish of managed SaaS.** This is unoccupied territory: Postiz proves self-hosted marketing tooling can ship polished UX, Metabase proves self-hosted BI can scale — but neither covers the agency Meta Ads workflow. Winning Kart's TCO is a one-time deploy + Postgres + small monthly hosting, with no per-client or per-spend meter. Data residency is wherever the captain's box lives, which is **directly aligned with UAE PDPL and GDPR** without contractual gymnastics. The tradeoff is real maintenance burden — but for an agency that already runs infrastructure (or is willing to), it is the only path that lets the captain offer the platform to external clients *as his own product*.

---

## 5. Competitive Positioning Recommendation

### Angle 1 — "Your data, your roof" (Operator-Ownership for Agencies)
- **Targets**: independent agencies and freelancers serving 5–50 ad accounts, especially those burned by per-spend pricing or vendor shutdowns.
- **Value prop**: *The only self-hosted Meta Ads dashboard built for agencies — own your data, cap your costs, brand it as yours.*
- **Proof points**: (a) deploy on any VPS, no serverless lock-in; (b) AES-256-GCM encrypted tokens in your Postgres; (c) flat TCO vs verified AgencyAnalytics/Whatagraph/Northbeam floors.
- **Risk**: positioning "self-hosted" turns off non-technical buyers; needs a managed-hosting offering to convert them.

### Angle 2 — "Reports clients trust at first glance" (Premium Client Portal)
- **Targets**: agencies whose retention depends on client-facing trust; boutique performance agencies; agencies that lose clients to bigger shops with polished reporting.
- **Value prop**: *A paper-ledger performance report your client understands in 5 seconds — branded, premium, yours.*
- **Proof points**: (a) binding Claude paper-and-clay theme vs the generic dashboard aesthetic of AgencyAnalytics/Whatagraph; (b) ROAS hero figure + winner/loser row tinting per DESIGN.md; (c) client role with strict scope separation per PRODUCT.md.
- **Risk**: aesthetic differentiation is subjective and can be copied; must pair with depth (planning, attribution) to lock in.

### Angle 3 — "Plan, run, report — one operator surface" (Unified Workflow)
- **Targets**: agencies currently stitching 3–5 SaaS tools (execution + reporting + attribution + creative swipe + planning).
- **Value prop**: *One surface for goal→budget→campaign→report→plan-vs-actual, on infrastructure you own.*
- **Proof points**: (a) spec sections 04/05/07/08/09 cover the full chain; (b) MCP API tokens let external automation participate; (c) collapses ≥3 subscription line items.
- **Risk**: breadth dilutes focus; MVP must ship enough of each layer to be credible or the position collapses back to "dashboard".

---

## 6. Pricing Posture Options

### Option A — Open-core (recommended for the captain's thesis)
- OSS self-host free (agency operates it); paid managed cloud + paid support + paid premium modules (white-label, advanced attribution, creative intelligence).
- **Signals**: trust, adoption, alignment with Postiz/Metabase precedent; converts technical agencies to advocates; lets the captain run his own agency on the free tier.
- **Tradeoff**: monetisation depends on the managed tier; OSS maintenance burden is real.

### Option B — Per-agency flat (simplest commercial model)
- Single price per agency, unlimited clients/ad accounts/users; tiered by feature (Starter / Pro / Enterprise add-ons).
- **Signals**: "no per-seat games" — a direct counter to AgencyAnalytics' per-client and Whatagraph's per-credit model; resonates with small agencies.
- **Tradeoff**: top-line grows only with new agencies, not with roster growth; harder to monetise a power user.

### Option C — Per-client-tier with self-host discount
- Per-client pricing when managed-hosted; deep discount (or free) when self-hosted.
- **Signals**: familiar to the market (matches AgencyAnalytics' mental model) but improves on it.
- **Tradeoff**: re-introduces the per-client cost wall the captain wants to attack; only viable if the self-host path is genuinely attractive.

*(No competitor pricing is invented here. The three options are anchored only to the verified floors in §2.)*

---

## 7. Opportunity Scorecard

| Dimension | Score (0–5) | Rationale |
|---|---|---|
| Data ownership | 5 | Only self-hosted Meta Ads dashboard with agency hierarchy; verified incumbents are all cloud-only |
| Attribution transparency | 4 | "Show your work" is defensible vs Moby/Apex/Synapse black boxes; must build the layer to claim it |
| Client portal quality | 5 | Paper-ledger theme is a visible, hard-to-copy quality signal; verified reporting incumbents are generic |
| Creative intelligence | 3 | Spec section 04 plans it, but Foreplay/AdCreative.ai/Motion have a multi-year head start |
| Unified planning | 4 | Spec sections 07/08/09 cover it; no verified incumbent covers planning+execution+reporting in one |
| Regional / MENA fit | 5 | UAE agency origin, AED-native, Asia/Dubai, Arabic opportunity — verified incumbents are USD/EUR-only |
| Automation / API (MCP) | 5 | MCP API tokens already in production; matches the 2025–2026 MCP wave started by Improvado/Foreplay/Postiz/Databox/AgencyAnalytics |
| Total cost | 5 | One-time deploy + small hosting vs verified $400–$1,500/mo SaaS floors for comparable agency rosters |

---

## 8. What Could Not Be Verified (captain to confirm)

- **AdEspresso sunset**: widely cited as sunset by Hootsuite in early 2024; the canonical Hootsuite notice URL returned 404 during research. Treat the date as unverified; the sunset itself is industry-consensus.
- **Madgicx tier prices**: pricing page is spend-gated ("See price inside the app"); only Tracking Pro add-on ($49/mo) is publicly verifiable.
- **Hunch, Smartly.io, Skai, Marin, AdScale, Wask, Sprinter pricing**: all demo-only / contact-sales; no public tiers.
- **AdCreative.ai pricing tiers**: page returned but pricing section did not render in research; only the 7-day trial and ~4.2M-user claims are verifiable.
- **Mixpost pricing**: vendor site was unreachable during research; positioning as open-source social scheduling is well-known but current tiers are unverified.
- **Lifesight, Prescient AI, Motion (motion.ad), Sweepy, AdRapid, Adomik, NinjaCat, ReportGarden, Swydo, Adriel**: not directly fetched in this research pass; classifications in §1 are based on widely-accepted positioning but specific pricing/feature claims should be re-verified before any captain-facing competitive claim.
- **Datorama / Salesforce Marketing Intelligence**: Salesforce keeps this inside its CRM/Cloud licence bundle; no standalone price tier to cite.

---

## Sources

- https://madgicx.com/pricing
- https://revealbot.com/pricing
- https://www.agencyanalytics.com/pricing
- https://www.whatagraph.com/pricing
- https://www.triplewhale.com/pricing
- https://www.northbeam.io/pricing
- https://postiz.com/pricing
- https://www.metabase.com/pricing
- https://improvado.io/pricing
- https://foreplay.co/pricing
- https://databox.com/pricing
- https://www.hunchads.com/
- https://www.adcreative.ai/
- https://skai.io/
- https://www.smartly.io/
- https://www.marinsoftware.com/
