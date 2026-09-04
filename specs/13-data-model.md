# 13 — Data Model & Relationships

> Status: DRAFT (crewmate done, pending first-mate review).
> Scope: **the domain model only** — entities, fields that matter, relationships,
> cardinality, and the additive migration posture from today's `src/db/schema.ts`.
> **No SQL, no DDL, no code.** Per captain's section 24: "Explain relationships.
> Do not implement the database yet."
>
> Binding dependencies: `spec/01-product-architecture.md` (anchor — §2 entity
> chain, §2.2 parallel chains, §6 non-duplication, §7 AdPlatform seam),
> `src/db/schema.ts` (the existing three tables), `PRODUCT.md` (UAE / AED /
> Asia/Dubai; AES-256-GCM tokens; admin/client roles). Cross-references:
> `03`…`12` for entity harvest; `16-data-gaps-and-risks.md` for reliability
> tiers that constrain the model.

---

## 0. Modeling principles

1. **Additive only.** Every existing table (`clients`, `ad_accounts`,
   `api_tokens`) and every existing column keeps its meaning. New behavior is
   layered on via **nullable discriminator columns**, new tables, and new
   FKs — never by rewriting or splitting an existing column. See §4.
2. **Honor the anchor's terminology.** *Agency*, *Client* (brand), *Agency
   user*, *Client user*, *Ad Account*, *Platform*, *Workspace*, *Client Portal*,
   and the *entity chain* (Agency → Client → Ad Account → Campaign → Ad Set →
   Ad / Creative) are used exactly as `01` defines them.
3. **Revenue is not a node.** Per `01` §2.2 and `06` §0, revenue arrives from
   outside the chain and is *attributed back* onto Campaign / Ad Set / Ad.
   There is no FK from a campaign to "its revenue"; the join lives on the
   attribution result, not the entity.
4. **The platform-adapter seam is one discriminator.** `AdAccount.platform`
   selects the adapter; per-platform identifiers live in a platform-specific
   payload. Adding Google / TikTok / Snapchat / LinkedIn is a new adapter +
   new platform value, never a new schema (`01` §7, `10` §4).
5. **Plans link; they do not own.** `PlanLink` is the only join between a
   `MarketingPlan` and execution entities (`08` §1.6, §6). Removing a link
   never deletes the entity.
6. **Field names only, no types.** Each entity lists the fields that matter
   (especially FKs and discriminator fields). Column types are deferred to
   implementation.

---

## 1. Prior entities (baseline from the archived `src/db/schema.ts`)

> **Aug 2026 note:** the fresh start dumped the previous repo. The table below
> documents the *archived* schema so the additive-migration vocabulary in §4
> stays meaningful; on the fresh build, this catalog is implemented **new** in
> `packages/db` (Drizzle), with brand/login already split per §2.2 and the
> role discriminators present from day one.

Today's schema is three tables and one enum. Every later section extends this
baseline non-destructively.

| Entity | Table | Purpose | Key fields |
|---|---|---|---|
| **Client (login)** | `clients` | Today conflatues *two* concepts: the **brand being served** and the **login account** (agency or client user). The proposed model separates these (see §2, §6). | `id`, `name`, `slug`, `email`, `passwordHash`, `role` (enum), `createdAt`, `updatedAt`. Unique on `email`, `slug`. |
| **AdAccount** | `ad_accounts` | A platform ad account owned by exactly one client row. Today implicitly Meta. | `id`, `clientId` (FK→clients, cascade), `name`, `slug`, `adAccountId` (the platform's `act_xxx`), `businessId`, `pageId`, `pixelId`, `accessTokenEncrypted` (AES-256-GCM), `currency` (default `AED`), `timezone` (default `Asia/Dubai`), timestamps. Unique on `slug`. |
| **ApiToken** | `api_tokens` | SHA-256-hashed bearer tokens for MCP / REST programmatic access. Already production-shipped (`src/lib/mcp.ts`). | `id`, `name`, `tokenHash`, `createdAt`, `lastUsedAt`, `revokedAt`. Unique on `tokenHash`. |
| *enum* | `client_role` | Today's two roles: `admin`, `client`. Preserved verbatim in the proposed model; finer roles discriminate *on top of* these (`11` §0.1, §9). | — |

**Today's roles model** is exactly two values. The seven-role RBAC matrix in
`11` is layered on via two new nullable columns (`agency_role`,
`client_role_tier`) — see §2 RBAC group and §4.

**Today's token storage** is AES-256-GCM (`accessTokenEncrypted`,
`ad_accounts`) for Meta OAuth tokens, and SHA-256 (`tokenHash`, `api_tokens`)
for API tokens. The proposed model reuses both paths verbatim and generalizes
the AES-256-GCM envelope to every connector credential (`10` §0, §1).

---

## 2. Entity catalog (proposed full model)

Grouped by the chains in `01` §2. **FKs and discriminator fields are
emphasized**; secondary fields are summarized. "Minor" entities (pure joins,
config singletons) are marked.

### 2.1 Tenant & hierarchy

| Entity | Purpose | Fields that matter |
|---|---|---|
| **Agency** (alias *Organization*) | The operator org that owns this Winning Kart instance. Single-tenant today (one row); modeled explicitly so it owns workspace defaults, white-label, billing, license. | `id`, `name`, `slug`, `defaultCurrency` (AED), `defaultTimezone` (Asia/Dubai), `defaultDatePreset`, `legalName`, `address`, `trn` (UAE tax reg), `primaryContact`, `supportEmail`, `logoAssetId`, timestamps. |
| **Workspace** *(concept, not a table)* | Per `01`, the agency-side application surface. Realized as the `Agency` row + user role checks; no separate table required. | — |
| **ClientPortal** *(concept)* | The deliberately reduced client-side surface (`01` §3.5). Realized as a per-client config block on `Client`. | — |

### 2.2 Users & RBAC (parallel chain off Agency; `11`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **User** | A login account — agency-side **or** client-side. **Reconciles today's `clients` table split** (see §6): identity, credentials, and role live here, *not* on the brand. | `id`, `agencyId` (FK→Agency), `email`, `passwordHash` (bcrypt, 12 rounds), `displayName`, `role` (today's enum, preserved), **`agencyRole`** (nullable discriminator: `owner` / `admin` / `account_manager` / `marketer` / `analyst`), **`clientRoleTier`** (nullable discriminator: `admin` / `viewer`), `mfaSecretEncrypted`, `status`, `lastActiveAt`, timestamps. Unique on `email`. |
| **Client** (the brand) | The brand the agency serves. Today's `clients` rows that represent brands are migrated here; rows that represent logins are migrated to `User`. | `id`, `agencyId` (FK→Agency), `name`, `slug`, `status` (`active` / `paused` / `archived` — `03` §8 open question #1), `industry`, `primaryContactUserId` (FK→User), `assignedAccountManagerUserId` (FK→User), `displayCurrency`, `shareCostAndMarginWithClient` (toggle from `06` §5.3 / `11` §3.3), timestamps. Unique on `slug`. |
| **ClientUserAssignment** *(minor, join)* | Binds a client-side `User` to the `Client` it can see (a Client Admin/Viewer sees exactly one client). | `userId`, `clientId`. |
| **ClientStaffAssignment** *(minor, join)* | Binds an agency-side `User` (AM / Marketer / Analyst) to the set of `Client`s they may touch (`11` §1.3–§1.5). Enforced at the query layer; unassigned clients return 404, not 403. | `userId`, `clientId`, `roleAtClient`. |
| **Role** | The seven canonical roles from `11` §1. V1 ships fixed rows (no custom roles); the matrix in `11` §2 is the source of truth. | `id`, `name`, `side` (`agency` / `client`), `discriminatorColumn` (`agencyRole` or `clientRoleTier`), `discriminatorValue`. |
| **Permission** | A nav-item or action grant (e.g. `campaigns:write`, `reports:schedule`, `audit_log:read`). One row per cell in the `11` §2 matrix. | `id`, `key`, `category`, `description`. |
| **RolePermission** *(minor, N:M)* | Materializes the `11` §2 matrix. | `roleId`, `permissionId`. |
| **Invite** *(minor)* | Pending email invite with pre-assigned role + client scope. | `id`, `email`, `invitedByUserId`, `roleId`, `clientAssignments` (JSON), `expiresAt`, `acceptedAt`. |
| **PasswordResetToken** *(minor)* | Single-use, SHA-256-hashed, 30-min TTL (`11` §7.3). | `id`, `userId`, `tokenHash`, `expiresAt`, `consumedAt`. |

### 2.3 Entity chain — Ad Account → Campaign → Ad Set → Ad / Creative (`01` §2.1, `04`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **AdAccount** *(extends existing)* | A platform ad account owned by one `Client`. **Gains a `platform` discriminator** (default `meta`); today's Meta-specific fields (`businessId`, `pageId`, `pixelId`) move conceptually into a platform payload but remain as columns for backward compatibility. | existing fields + **`platform`** (discriminator: `meta` / `google_ads` / `tiktok` / `snapchat` / `linkedin`, default `meta`), `platformPayload` (JSON: per-platform identifiers — Meta's BM/page/pixel, Google's customer_id, etc.), `monthlyCapAmount`, `monthlyCapCurrency`, `lastSyncAt`, `accountStatusRaw`, `healthState`. `clientId` now FK→**Client** (brand), not the old login row. |
| **BusinessAccount** *(optional entity)* | A platform-level Business Manager / customer container. For Meta today it is text on AdAccount; this entity activates when one agency manages multiple BMs across clients. Mostly dormant in MVP. | `id`, `platform`, `platformBusinessId`, `name`, `owningClientId`, `agencyId`. |
| **Campaign** | A campaign on one AdAccount. Platform-specific id; never shared across platforms (`01` §7). | `id`, `adAccountId` (FK), `platformCampaignId`, `name`, `status`, `objective`, `buyingType`, `dailyBudget`, `lifetimeBudget`, `scheduleStart`, `scheduleEnd`, `currency` (denormalized from AdAccount), timestamps. |
| **AdSet** | A targeting/pacing/placement layer under a Campaign. | `id`, `campaignId` (FK), `platformAdsetId`, `name`, `status`, `optimizationGoal`, `bidStrategy`, `pacingType`, `dailyBudget`, `lifetimeBudget`, `targetingPayload` (JSON: audiences, geo, age/sex, placements), `promotedObject`, timestamps. |
| **Ad** | A deliverable ad under an AdSet; references one or more Creatives. | `id`, `adsetId` (FK), `platformAdId`, `name`, `status`, `reviewFeedback`, `displayFormat`, timestamps. |
| **Creative** | First-class creative object, parallel to Ad (`01` §2.1). One creative may serve across many ads. | `id`, `adAccountId` (FK), `platformCreativeId`, `name`, `format` (`image` / `video` / `carousel` / `collection`), `previewAssetRef`, `bodyCopy`, `firstSeenAt`, `lastSeenAt`. |
| **AdCreative** *(minor, N:M)* | One creative can serve across many ads (`04` §4). | `adId`, `creativeId`. |
| **Audience** | Saved / lookalike / custom audience at the AdAccount level (`05` §4.3). | `id`, `adAccountId` (FK), `platformAudienceId`, `name`, `type` (`saved` / `lookalike` / `custom`), `sourceAudienceId` (lookalike seed), `approxSizeLower`, `approxSizeUpper`, `agencyTag` (`winner` / `underperformer`), `lastServedAt`. |
| **Placement** *(dimension, not a table)* | Per `05` §2.3 a breakdown (`publisher_platform × platform_position × impression_device`). Lives as a breakdown dimension on `DailyInsight`, not its own entity. | — |
| **ConversionEvent** | The pixel/dataset events wired to an AdAccount (`03` §4.1 — `PageView`, `AddToCart`, `Purchase`, …). | `id`, `adAccountId` (FK), `eventName`, `eventType`, `isPrimary`. |

### 2.4 Performance facts (the ledger base; `04`, `05`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **DailyInsight** | The fact table: one cell per `{adAccount, entity-level, entity-id, date, breakdown}` (`10` §0 dedup key). The canonical metric set normalized across platforms (`01` §7). | `id`, `adAccountId`, `entityLevel` (`account` / `campaign` / `adset` / `ad` / `creative` / `audience`), `entityId`, `platform`, `date` (in AdAccount timezone), `breakdown` (JSON: placement / country / age / sex / device), `spend`, `impressions`, `reach`, `clicks`, `ctr`, `cpc`, `cpm`, `frequency`, `actions` (JSON), `actionValues` (JSON), `purchaseRoas`, `costPerActionType` (JSON), `currency`. Idempotency key = the bracketed tuple. |
| **HourlyStat** | Hour-of-day / day-of-week capture for `05` §2.4 heatmap. Captured on schedule (Meta retains only ~7d). | `id`, `adAccountId`, `entityLevel`, `entityId`, `dateHour` (advertiser tz), `spend`, `impressions`, `cpm`, `ctr`, `cpa`, `roas`, `conversions`. |
| **EntityEvent** | Append-only audit of state changes on a chain entity (`04` §2.1 #12 "Activity / History"). | `id`, `entityLevel`, `entityId`, `eventType` (`status_change` / `budget_edit` / `creative_swap` / `review_rejection`), `actorUserId`, `oldValue`, `newValue`, `occurredAt`. |

### 2.5 Revenue & Attribution (`06`) — *attributed back onto the chain, not a node*

| Entity | Purpose | Fields that matter |
|---|---|---|
| **RevenueSource** *(specialized role of `Connector`)* | A revenue-ingesting connection (Shopify / WooCommerce / CRM / custom API / offline). Model: one row in `Connector` with `category = revenue`, plus this config sidecar. | `id`, `connectorId` (FK), `clientId` (FK), `sourceType` (`shopify` / `woocommerce` / `hubspot` / `salesforce` / `custom_api` / `offline_csv`), `storeDomainOrBaseUrl`, `dedupKeyPattern`, `currency`, `matchQualityPctA+B`. |
| **RevenueEvent** | Immutable order-level event (`06` §1). Corrections are new events with a `replacesEventId` pointer. | `id`, `revenueSourceId` (FK), `clientId` (FK), `sourceOrderId`, `tsUtc`, `value`, `currency` (presentment), `baseCurrency`, `valueInBaseCurrency`, `customerEmailHash`, `customerPhoneHash`, `clickIds` (JSON keyed by platform: `fbclid` / `gclid` / `ttclid` / `scclid`), `utm` (JSON), `referrer`, `landingUrl`, `lineItems` (JSON), `replacesEventId` (self-FK nullable). Dedup key per `06` §1. |
| **IdentitySignal** *(optional, denormalized)* | Resolved identity per event — the strongest signal that matched (`06` §2). Can be inline on `RevenueEvent`; separate table if you want an audit trail of stitch attempts. | `revenueEventId`, `matchTier` (`A_deterministic` / `B_probabilistic` / `C_platform` / `D_unmatched`), `resolvedEntityType` (`ad` / `campaign` / `channel_group` / `none`), `resolvedEntityId`. |
| **AttributionModel** | A configured model for one client (`06` §3). | `id`, `clientId` (FK), `modelType` (`platform_meta` / `first_touch` / `last_touch` / `linear` / `time_decay` / `position_based`), `windowDaysClick`, `windowDaysView`, `halfLifeDays` (time-decay), `isDefault`. |
| **AttributionRun** | One execution of an attribution model over a window (`06` §5.2). | `id`, `clientId`, `modelId`, `windowStart`, `windowEnd`, `runAt`, `status` (`running` / `succeeded` / `partial` / `failed`), `matchQualityPctA+B`, `errorClass`. |
| **AttributionResult** | **The "attributed back onto the chain" join.** Credit assigned to a chain entity for one run. This is what makes Revenue *not a node*. | `id`, `attributionRunId` (FK), `entityLevel`, `entityId`, `attributedRevenue`, `attributedPurchases`, `creditShare`. |
| **MarginRule** | Per-SKU / per-category / per-order / flat margin (`06` §5.3). Client-provided; never derived. | `id`, `clientId`, `scopeType` (`sku` / `category` / `order` / `flat`), `scopeKey`, `marginPct`, `cogsAmount`. |
| **Customer** *(partial, flagged `16`)* | First-party customer identity for CAC / LTV cohorts. Only meaningful where a revenue source with stable customer IDs exists; `[not-reliably-available]` otherwise. | `id`, `clientId`, `customerEmailHash`, `firstSeenAt`, `lifetimeRevenue`, `lifetimePurchases`. |

### 2.6 Marketing Plans (`08`)

A plan is one **MarketingPlan** plus six linked sub-entities. All names are
`08`'s canonical names; aliases reconciled in §6.

| Entity | Purpose | Fields that matter |
|---|---|---|
| **MarketingPlan** | The strategy artifact for one Client. Owns targets, not execution. | `id`, `clientId` (FK), `name`, `status` (`draft` / `active` / `completed` / `archived`), `periodStart`, `periodEnd`, `currency`, `totalBudget`, `ownerUserId` (FK), `version`, timestamps. |
| **PlanGoal** | A quantified business goal (`08` §1.1). | `id`, `planId` (FK), `goalType`, `direction`, `targetValue`, `currency` / `unit`, `periodStart`, `periodEnd`, `ownerUserId`, `sortOrder`. |
| **PlanObjective** | The strategic lever (`awareness` / `lead_gen` / `sales` / `retention`); maps to campaign `objective` (`08` §1.2). | `id`, `planId` (FK), `objective`, `weight`, `note`. |
| **PlanKpi** | Operating-target dial with status thresholds (`08` §1.3). | `id`, `planId` (FK), `metricKey`, `targetValue`, `direction`, `onTrackThreshold`, `atRiskThreshold`, `scope`. |
| **PlanBudgetAllocation** | Allocation line at one of three levels (`08` §1.4). | `id`, `planId` (FK), `level` (`channel` / `campaign` / `monthly`), `levelKey`, `campaignId` (nullable FK→Campaign), `adAccountId` (nullable FK), `plannedAmount`, `currency`, `monthKey` (YYYY-MM, when level=monthly). |
| **PlanStrategy** | Structured strategy documentation (`08` §1.5). One row per plan. | `id`, `planId` (FK), `targetAudience`, `offer`, `creativeStrategy`, `funnelStrategy`, `channelStrategy`, `testingPlan`, `executionPlan` (all structured JSON). |
| **PlanLink** | **The link contract** (`08` §1.6) — the only join between a plan and execution entities. | `id`, `planId` (FK), `linkType` (`campaign` / `adset` / `creative` / `ad_account` / `task`), `entityId`, `role` (`primary` / `supporting` / `exclude`), `objective`, `note`. |
| **PlanShare** | Opt-in client-portal share (`08` §5). | `id`, `planId` (FK), `scope` (`summary` / `full`), `shareToken`, `expiresAt`, `revokedAt`. |

### 2.7 Tasks, Alerts, Insights (`09`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **Task** | The owned "what should I do next" work item (`09` §2.2). | `id`, `title`, `description`, `clientId` (FK, nullable for agency-internal), `entityLevel`, `entityId` (deep-link), `priority` (`low` / `medium` / `high` / `urgent`), `assigneeUserId`, `dueDate`, `status` (`todo` / `in-progress` / `done` / `skipped`), `source` (`plan` / `alert` / `recommendation` / `manual`), `sourcePlanId`, `sourceGoalId`, `sourceKpiId`, `linkedAlertIds`, `linkedInsightId`, timestamps. |
| **TaskComment** *(minor)* | Per-task thread; @-mention triggers notification. | `id`, `taskId`, `userId`, `body`, `createdAt`. |
| **Alert** | A detected signal — analytical or operational (`09` §3). | `id`, `triggerType` (the `09` §3.1 catalog), `severity` (`critical` / `warning` / `info`), `clientId`, `entityLevel`, `entityId`, `whatHappened`, `whyItMatters`, `supportingMetrics` (JSON), `recommendedAction`, `ctaTarget`, `status` (`open` / `snoozed` / `acknowledged` / `suppressed` / `dismissed`), `dismissReason`, `detectedAt`, `suppressedByTaskId`. |
| **Insight** (alias *Recommendation*) | The diagnostic layer — the *why* beneath an alert (`09` §4). Canonical name **Insight**; **Recommendation** is the page-level alias. | `id`, `insightType` (the `09` §4.3 catalog), `severity`, `clientId`, `entityLevel`, `entityId`, `headlineMetric`, `deltaPct`, `primaryCauseEntityType`, `primaryCauseEntityId`, `attributionStatus` (`attributed` / `unattributed`), `decomposition` (JSON: top contributors + share), `recommendedAction`, `ctaTarget`, `acceptedAsTaskId`, `notUsefulCount`, `createdAt`. |

### 2.8 Reports (`07`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **ReportTemplate** | Reusable starting point with a block outline (`07` §1.2, §4). | `id`, `agencyId`, `name`, `audience` (`client` / `internal`), `cadence`, `blocks` (ordered JSON), `isDefaultFor`. |
| **Report** | A generated instance — frozen at generation time (`07` §2 step 10). | `id`, `templateId` (nullable FK), `clientId` (nullable — multi-client rollups), `name`, `periodStart`, `periodEnd`, `comparisonType`, `currency`, `timezone`, `lensState` (JSON: the filter state), `frozenData` (JSON or ref), `format`, `generatedAt`, `status`. |
| **ReportBlock** | An ordered block instance within a Report (`07` §3). | `id`, `reportId` (FK), `blockType` (the `07` §3.1–§3.12 catalog), `order`, `config` (JSON), `interaction` (`snapshot` / `live`), `visibility` (`visible` / `hidden_from_client`). |
| **ReportSchedule** | Recurring generation + delivery (`07` §1.4, §5). | `id`, `name`, `templateId`, `clientId`, `cadence` (`daily` / `weekly` / `monthly` / `one_off`), `timezone`, `nextRunAt`, `lastOutcome`, `deliveryChannels` (JSON), `status`. |
| **ReportDelivery** | One delivery attempt for one Report through one channel (`07` §5). | `id`, `reportId`, `channel` (`portal` / `email` / `slack`), `target`, `status`, `attemptAt`, `errorClass`. |
| **ReportComment** *(minor)* | Per-block comment thread in the portal (`07` §7). | `id`, `reportBlockId`, `userId`, `body`, `createdAt`. |
| **WhiteLabelConfig** | Brand composition within the one-accent rule (`07` §6). | `id`, `agencyId`, `mode` (`clay_preserving` / `brand_accent`), `wordmarkAssetId`, `accentColor`, `senderName`, `senderEmail`, `customDomain`, `domainVerifiedAt`. |

### 2.9 Dashboards (Client Portal; `01` §3.5, `02` §2)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **Dashboard** | Config of the Client Portal dashboard for one `Client` (the agency-author shape the client sees). | `id`, `clientId` (FK), `name`, `isPrimary`, `version`. |
| **DashboardWidget** | One widget on a Dashboard (KPI card, trend strip, etc.). | `id`, `dashboardId` (FK), `widgetType`, `order`, `config` (JSON), `dataSource`. |

### 2.10 Budget & Pacing (`05` §5)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **MonthlyBudgetCap** | Client- or account-level monthly cap (`05` §5.2). Operator-set, local. | `id`, `clientId` (FK), `adAccountId` (nullable FK), `monthKey` (YYYY-MM), `capAmount`, `currency`, `deliveryType` (`daily` / `lifetime` / `cbo` / `monthly`). |

*Note:* **Goal** and **KPI** as standalone client-level entities are
**reconciled away**: per `03` §3 step 3 ("Configure Goals … inside the
Marketing Plan sub-tab") and `08` §1.1/§1.3, client-level goals and KPIs are
realized as `PlanGoal` and `PlanKpi` rows on the client's active plan. There
is no separate `Goal` / `Kpi` table; the plan sub-entities are canonical.

### 2.11 Integrations / Connectors (`10`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **Connector** | The **common connector contract** (`10` §1). One row per connection — ad platform, revenue source, CRM, analytics, communication, automation. Supersedes "revenue source" as the connection primitive (a revenue source is `Connector` + `RevenueSource` sidecar). | `id`, `agencyId`, **`type`** (`meta`, `google_ads`, `tiktok`, `snapchat`, `linkedin`, `shopify`, `woocommerce`, `hubspot`, `salesforce`, `custom_crm`, `ga4`, `slack`, `smtp`, `outbound_webhook`, `custom_api_revenue`), **`category`** (`advertising` / `revenue` / `analytics` / `crm` / `communication` / `automation`), **`binding`** (`agency` / `client`), `clientId` (nullable FK — required when binding=client), **`authMethod`** (`oauth_authorization_code` / `oauth_client_credentials` / `api_key_header` / `basic_header` / `hmac_webhook_secret` / `service_account_json` / `smtp_password`), **`authPayloadEncrypted`** (AES-256-GCM blob), `scopesGranted`, `scopesRequired`, `syncMode`, `cronExpr`, `dedupKeyPattern`, `rateLimitPolicy`, `mappedEntities`, `healthState`, `lastSyncAt`, `lastSyncStatus`, `lastError`. |
| **SyncJob** (alias *ConnectorSyncLog*) | One scheduled/webhook sync run (`10` §1.1). Append-only. | `id`, `connectorId` (FK), `startedAt`, `endedAt`, `status` (`queued` / `running` / `succeeded` / `partial` / `failed` / `escalated`), `errorClass`, `recordsPulled`, `dedupHits`. |
| **ConnectorEvent** | The ingested-records ledger for revenue / CRM connectors (`10` §0 schema delta). Distinct from `RevenueEvent` (which is post-mapped, deduped, ready to attribute). | `id`, `connectorId`, `rawPayload` (JSON), `receivedAt`, `dedupKey`, `mappedToRevenueEventId` (nullable FK). |
| **WebhookSubscription** | Outbound event subscriptions (`10` §9.3, `12` §9). | `id`, `agencyId`, `url`, `signingSecretEncrypted`, `subscribedEvents` (JSON), `lastDeliveryAt`, `lastHttpStatus`, `consecutiveFailures`, `status`. |

### 2.12 System & operations (`12`)

| Entity | Purpose | Fields that matter |
|---|---|---|
| **ApiToken** *(existing, unchanged)* | SHA-256-hashed MCP/REST bearer tokens. | as today + `scopes` (JSON; `read:insights`, `read:accounts`, `write:campaigns`…), `rateLimitPerMin`. |
| **SavedView** | Reusable Analytics / Campaigns lens (`05` §1.3, `04` §1.2). Agency-scoped (not client-scoped). | `id`, `ownerUserId`, `name`, `surface` (`campaigns` / `analytics` / `audiences` / `budget`), `sharingScope` (`personal` / `team`), `state` (JSON: dimensions, metrics, filters, compare, chart). |
| **AuditLog** | Immutable who-did-what trail (`11` §8, `12` §12). Append-only. | `id`, `actorUserId`, `actorType` (`user` / `api_token` / `system`), `action`, `targetEntityType`, `targetEntityId`, `outcome`, `oldValue`, `newValue`, `ip`, `userAgent`, `occurredAt`. |
| **License** (alias *Subscription*) | The instance's plan tier + add-ons (`12` §3). | `id`, `agencyId`, `licenseKey`, `planTier` (`free` / `pro` / `enterprise`), `seatsAllotted`, `seatsInUse`, `renewalAt`, `graceWindowEndsAt`, `managedAddOns` (JSON). |
| **Invoice** | One billing record for the License / add-ons (`12` §3). | `id`, `agencyId`, `periodStart`, `periodEnd`, `amount`, `currency`, `planOrAddOn`, `pdfAssetRef`, `issuedAt`. |
| **NotificationPreference** | Workspace defaults + per-user overrides (`09` §6, `12` §6). | `id`, `userId` (nullable for workspace defaults), `channel` (`in_app` / `email` / `slack`), `severityThreshold`, `cadence`, `quietHoursStart`, `quietHoursEnd`, `timezone`. |
| **RetentionPolicy** | Per-`12` §8 retention config (one row per agency). | `agencyId`, `rawInsightsDays` (default 90), `aggregateRollupDays` (default 2555), `auditLogDays`. |
| **SecurityPolicy** | Per-`12` §11 posture (one row per agency). | `agencyId`, `mfaRequiredRoles` (JSON), `passwordMinLength`, `passwordComplexityRules`, `sessionTimeoutMin`, `ipAllowList` (JSON), `ssoConfig` (JSON). |
| **Asset** *(minor)* | Generic blob reference (logos, PDFs, exports). | `id`, `agencyId`, `kind`, `mime`, `storageRef`, `bytes`, `createdAt`. |
| **DataSubjectRequest** *(minor)* | GDPR/PDPL export or delete job (`12` §8). | `id`, `clientId` (nullable), `scope`, `kind` (`export` / `delete`), `status`, `requestedAt`, `completedAt`. |

---

## 3. Relationships

Cardinality for every meaningful link. FKs flow **down** the chain; references
**up** are reads, not ownership.

### 3.1 The backbone (entity chain, `01` §2.1)

```
Agency 1───N Client 1───N AdAccount 1───N Campaign 1───N AdSet 1───N Ad
                                              │                    │
                                              │                    └─ N───M Creative  (via AdCreative)
                                              │
                                              └─ 1───N Audience
                                              └─ 1───N ConversionEvent
```

- **Agency → Client**: 1:N (one operator org serves many brands; single-tenant today but explicit).
- **Client → AdAccount**: 1:N (a client may own multiple accounts across multiple platforms and currencies, `01` §2.1).
- **AdAccount → Campaign → AdSet → Ad**: each 1:N — the rigid drill-down spine.
- **Ad ↔ Creative**: N:M (one creative across many ads; `04` §4).
- **Client → BusinessAccount**: 1:N (dormant in MVP; activates for multi-BM agencies).

### 3.2 Parallel chains off Agency (`01` §2.2)

```
Agency ─┬─ 1:N User ── N:M Role ── N:M Permission
        ├─ 1:N ReportTemplate, ReportSchedule, WhiteLabelConfig, SavedView
        ├─ 1:N Connector ── 1:N SyncJob
        │              └── 1:N ConnectorEvent
        └─ 1:1 License, RetentionPolicy, SecurityPolicy

User ── N:M Client  (via ClientStaffAssignment for agency roles;
                     via ClientUserAssignment for client roles; 1:1 in practice
                     for client users who see exactly one client)
```

### 3.3 Revenue attribution — *the rule*

```
Client 1───N RevenueSource 1───N RevenueEvent
                                   │
                                   └─ (IdentitySignal → stitch)
                                              │
                                              ▼
                          AttributionModel ── AttributionRun ── AttributionResult
                                                                    │
                                                                    └─► entityLevel + entityId
                                                                         (Campaign / AdSet / Ad)
```

**Revenue never owns a campaign.** A `RevenueEvent` is matched by identity to
zero or one chain entity; an `AttributionResult` row assigns credit by
`(run, entityLevel, entityId)`. Reading "ROAS for Campaign X" reads AttributionResult
rows, not a column on Campaign. This is `01` §2.2 / `06` §0 made structural.

### 3.4 Plan ↔ execution — *the link contract*

```
MarketingPlan 1───N PlanGoal
              1───N PlanObjective
              1───N PlanKpi
              1───N PlanBudgetAllocation ── (campaignId?) ▶ Campaign
              1───1 PlanStrategy
              1───N PlanLink ── (linkType, entityId) ▶ Campaign | AdSet | Creative | AdAccount | Task
              1───N PlanShare
```

`PlanLink` is the **only** structural join between a plan and execution. It is
read-only on the entity side: editing a campaign never mutates its plan beyond
re-reading actuals.

### 3.5 Tasks / Alerts / Insights ↔ everything

```
Alert  ── (suppressedByTaskId)         ── Task
Insight ── (acceptedAsTaskId)          ── Task
Task   ── (entityLevel, entityId)      ── any chain entity (Campaign / AdSet / Ad / Account / Plan)
Task   ── (sourcePlanId / sourceGoalId / sourceKpiId)  ── Plan / PlanGoal / PlanKpi
```

A signal flows one direction (data → detection → insight+alert → task → entity);
back-links are badges ("1 open task") rendered on the entity row, not stored
on the entity.

### 3.6 Connector → SyncJob → AuditLog

```
Connector 1───N SyncJob        (lifecycle log)
Connector 1───N ConnectorEvent (raw ingest; revenue/CRM only)
Connector ── (clientId?) ── Client   (when binding = client)
Connector ── AuditLog   (every connect/reconnect/disconnect appends an audit row)
```

### 3.7 RBAC: User → Role → Permission → nav/action

```
User 1───1 Role                  (via agencyRole / clientRoleTier discriminators)
Role N───M Permission            (via RolePermission)
Permission ── (key) ── nav item or action gate
User N───M Client                (via ClientStaffAssignment for agency roles;
                                  via ClientUserAssignment, in practice 1:1, for client roles)
```

The two nullable discriminator columns (`agencyRole`, `clientRoleTier`) carry
the role on the `User` row directly for fast checks; `Role` / `RolePermission`
exist to make the matrix editable in V2 without code changes (`11` §5).

### 3.8 The platform-adapter seam (`01` §7, `10` §1, §4)

```
AdAccount.platform  (discriminator: meta | google_ads | tiktok | snapchat | linkedin)
        │
        ├── selects which adapter answers list/insights/write calls
        └── AdAccount.platformPayload (JSON) carries per-platform identifiers:
                 Meta:  businessId, pageId, pixelId
                 Google: customerId, merchantId
                 TikTok: advertiserId
                 ...

Connector (category=advertising, type=<platform>) holds the encrypted credential
        └── one Connector per (Client, platform) credential; AdAccounts reference
            the platform by name, not by Connector id (a credential may rotate
            without touching AdAccount rows).
```

**This seam is why no nav item is named "Meta …"** — the surfaces are generic
and the adapter answers (`01` §7). Adding a platform = one new `platform` value
+ one new `Connector.type` adapter, **not** a schema change.

---

## 4. Additive migration posture (non-breaking only)

Every change below is **additive**: existing columns keep their meaning,
existing rows keep working, existing guards (`requireAdmin`,
`requireAdAccountAccess` in `src/lib/auth.ts`) keep firing.

### 4.1 Roles: 2 → 7 without breaking (`11` §9)

- **Keep** the `client_role` enum exactly as `["admin", "client"]`. Do not
  rename, do not remove values.
- **Add two nullable columns** to the login table (which is `User` after the
  split in §6; pre-split, on `clients`):
  - `agency_role` (nullable; values `owner` / `admin` / `account_manager` /
    `marketer` / `analyst`)
  - `client_role_tier` (nullable; values `admin` / `viewer`)
- **Defaults preserve today's behavior:** an `admin` row with null
  `agency_role` is treated as `admin`; a `client` row with null
  `client_role_tier` is treated as Client Admin. The first `admin` row by
  `created_at` is promoted to `agency_role = owner` in a one-time migration
  script (`11` §9 step 2). No other row changes.
- The new role checks are **new helpers** layered above `requireAdmin` /
  `requireAdAccountAccess`; the existing guards are untouched.

### 4.2 AdAccount gains a platform discriminator (`01` §7)

- **Add nullable `platform` column** with default `'meta'`. Every existing
  row is Meta today; the default makes the migration a no-op for reads.
- **Add nullable `platform_payload` JSON column.** Existing Meta columns
  (`business_id`, `page_id`, `pixel_id`) **stay in place** — a view or
  accessor can expose them as the Meta entry inside `platform_payload`, but
  the columns are not removed. New platforms populate `platform_payload`
  only.
- New agency-wide / per-client columns (`monthly_cap_amount`, `health_state`,
  `last_sync_at`, `account_status_raw`) are nullable additions.

### 4.3 New tables attach without disturbing existing reads

- **Revenue / attribution / margin / customer** tables are net-new. Today's
  ROAS path (Meta `purchase_roas` summarized in `summarizeInsights`) is the
  *platform* attribution model (`AttributionModel.modelType = platform_meta`);
  the new tables layer WK-computed models alongside, never replacing.
  Existing Campaigns surfaces keep working; the Attribution tab adds views on
  top.
- **Marketing plan** tables are net-new; the only structural join to existing
  data is `PlanLink.entityId` referencing chain entities — a read, not an
  ownership FK. No existing row is touched when a plan is created or deleted.
- **Alerts / insights / tasks** are net-new; they *reference* existing
  entities by `(entityLevel, entityId)`. Existing surfaces render a "1 open
  task" badge by querying Task, not by storing a flag.
- **Connector** is net-new; existing `ad_accounts.accessTokenEncrypted` is
  **not** migrated away. The Meta credential can stay on AdAccount (the
  Connector's `authPayloadEncrypted` is a mirror, or for Meta only, the
  Connector row references the AdAccount's token). Either way the existing
  read path in `src/lib/meta-api.ts` is unchanged.
- **AuditLog** is net-new and append-only; nothing existing is altered.
- **`ApiToken`** gains a nullable `scopes` JSON column and a nullable
  `rate_limit_per_min` column; existing tokens keep working with implicit
  read-only scope.

### 4.4 Migration order is independent

Each new table group (RBAC, Connector, Revenue/Attribution, Plan, Tasks,
Reports, Dashboards, System) can ship in a different release. None block
another; none require rewriting today's two flagship surfaces (Campaigns
table, Client Portal dashboard).

---

## 5. Multi-currency, timezone, and encryption in the model

### 5.1 Currency — three tiers, all explicit

| Tier | Where it lives | Default |
|---|---|---|
| **Workspace default** | `Agency.defaultCurrency` | `AED` |
| **Client display currency** | `Client.displayCurrency` | inherits workspace default |
| **Ad-account currency** | `AdAccount.currency` (existing) | `AED` |
| **Plan currency** | `MarketingPlan.currency` | inherits Client |
| **Revenue event** | `RevenueEvent.currency` (presentment) + `baseCurrency` + `valueInBaseCurrency` | from source |
| **Monthly cap** | `MonthlyBudgetCap.currency` | Client display currency |

ROAS math converts at order-day rate into the AdAccount currency (`06` §1.1,
`05` §6). Multi-currency rollups convert to Client display currency with a
dated footnote (`02`, `05`).

### 5.2 Timezone — Asia/Dubai default, AdAccount-local math

| Field | Where | Default |
|---|---|---|
| `Agency.defaultTimezone` | workspace | `Asia/Dubai` |
| `AdAccount.timezone` (existing) | per-account | `Asia/Dubai` |
| `ReportSchedule.timezone` | per-schedule | `Asia/Dubai` |
| `NotificationPreference.timezone` | per-user | user profile |

All period math — pacing, attribution windows, schedule triggers, the
Analytics hourly heatmap (`05` §2.4) — runs in the **AdAccount timezone**, not
the operator's browser tz. Report footers print both the schedule tz and the
source AdAccount tz (`07` §5).

### 5.3 Encryption — AES-256-GCM, one path

Every long-lived secret is encrypted at write time through the same
`src/lib/crypto.ts` (`encrypt` / `decrypt`, AES-256-GCM, 96-bit IV, auth tag,
layout `"iv_b64:tag_b64:data_b64"`). The Master Encryption Key
(`ENCRYPTION_KEY`) is operator-held env, never in the database.

| Field | Algorithm | Notes |
|---|---|---|
| `AdAccount.accessTokenEncrypted` (existing) | AES-256-GCM | unchanged. |
| `Connector.authPayloadEncrypted` | AES-256-GCM | OAuth tokens, refresh tokens, API keys, service-account JSON, SMTP passwords, HMAC secrets. |
| `User.mfaSecretEncrypted` | AES-256-GCM | TOTP secret alongside password hash (`11` §7.2). |
| `WebhookSubscription.signingSecretEncrypted` | AES-256-GCM | per-subscription HMAC secret (`10` §9.3). |
| `ApiToken.tokenHash` (existing) | SHA-256 | API tokens are hashed, not encrypted — they are bearer-grade and shown once at creation (`schema.ts`, `src/lib/mcp.ts`). |
| `PasswordResetToken.tokenHash` | SHA-256 | same pattern as `ApiToken`. |

Plaintext is never persisted and never re-exposed in the UI. Disconnect /
revoke destroys the credential row (cascade per `03` §4.2, `10` §3.1).

---

## 6. Cross-doc consistency — canonical names & aliases

Two page specs occasionally named the same entity differently. Canonical
names below; aliases are storage-only or page-label-only and never break the
model.

| Canonical | Alias | Where the alias appears | Resolution |
|---|---|---|---|
| **Agency** | Organization | `13` prompt, generic RBAC literature | `01` §terminology wins: *Agency* is the operator org. |
| **Client** (brand) | *(today's `clients` table)* | `src/db/schema.ts` | The `clients` table is **split**: brand rows → `Client`; login rows → `User`. The new `Client` is the brand; the new `User` is the login. See §2.2. |
| **User** | *(today's `clients` row that represents a login)* | `src/db/schema.ts`, `src/lib/auth.ts` | Login identity migrates to `User`; the existing `clients.email` / `passwordHash` / `role` columns are the source. |
| **Connector** | Integration, Revenue source, Sync source | `01` §3.3, `06` §1, `10` title | One entity, one contract. A *revenue source* is `Connector` (`category = revenue`) + `RevenueSource` sidecar. An *Integration* page is the operator view over `Connector` rows. |
| **AdPlatform** | Platform, adapter | `01` §7, `04` §0.3, `10` §4 | A **contract / discriminator**, not a table. Lives as `AdAccount.platform` + `Connector.type`. Adding a platform adds a value, not a schema. |
| **SyncJob** | ConnectorSyncLog | `10` §0, `10` §1.1 | One entity. *SyncJob* names the lifecycle; the table is the append-only log. |
| **Task** | Action | `01` §3.3 ("Tasks/Actions"), `09` §2 | `09` §2.2 schema is named **Task**; *Action* is a page-label synonym. |
| **Insight** | Recommendation | `09` §4 title, `09` §4.4 page | One entity, two roles: the analytical finding (Insight) and the action item it becomes when accepted (Task). The Recommendations sub-page renders Insight rows. Canonical entity name **Insight**. |
| **License** | Subscription | `13` prompt, `12` §3 | `12` §3 uses "License key" and "Plan tier"; *Subscription* is a generic alias. Canonical **License**. |
| **AttributionModel** | Attribution model (config) | `06` §3 | Same. |
| **AttributionResult** | *(none — new in `13`)* | `06` §0/§2 imply but do not name | Named here. The structural realization of "revenue attributed back onto the chain." |
| **PlanGoal / PlanObjective / PlanKpi / PlanBudgetAllocation / PlanStrategy / PlanLink / PlanShare** | *(sub-entities of MarketingPlan)* | `08` §1 | All seven canonical names from `08`. No aliases. |
| **Goal / KPI / Budget** (standalone) | *(per `13` prompt)* | `13` prompt lists these as candidate entities | **Reconciled away.** Client-level goals/KPIs are `PlanGoal` / `PlanKpi` on the active plan (`08` §1.1, §1.3; `03` §3 step 3). Budget as monthly cap is `MonthlyBudgetCap`; budget as plan allocation is `PlanBudgetAllocation`. No standalone `Goal` / `Kpi` / `Budget` tables. |
| **Workspace** | *(per `13` prompt)* | `01` §terminology | A **concept**, not a table — realized as the `Agency` row + role checks. |

---

*End of `13-data-model.md`. Extends `src/db/schema.ts` additively; honors the
anchor (`01`) terminology and the platform-adapter seam; revenue is attributed
back onto the chain, not modeled as a node; plans link to execution, they do
not own it. No SQL or code. Reliability tiers that constrain this model
revenue-side are owned by `06` §6 and rolled up in `16-data-gaps-and-risks.md`.*
