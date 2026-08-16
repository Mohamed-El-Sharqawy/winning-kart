import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  boolean,
  numeric,
  jsonb,
  bigint,
  date,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role", { enum: ["admin", "client"] }).notNull(),
    agencyRole: text("agency_role", {
      enum: ["owner", "admin", "account_manager", "marketer", "analyst"],
    }),
    clientRoleTier: text("client_role_tier", { enum: ["admin", "viewer"] }),
    status: text("status", { enum: ["active", "invited", "suspended"] })
      .notNull()
      .default("active"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)]
);

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status", { enum: ["active", "paused", "archived"] })
      .notNull()
      .default("active"),
    industry: text("industry"),
    primaryContactUserId: text("primary_contact_user_id").references(() => users.id),
    assignedAccountManagerUserId: text("assigned_account_manager_user_id").references(
      () => users.id
    ),
    displayCurrency: text("display_currency").notNull().default("AED"),
    shareCostAndMarginWithClient: boolean("share_cost_and_margin_with_client")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("clients_slug_uq").on(t.slug)]
);

export const adAccounts = pgTable(
  "ad_accounts",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    adAccountId: text("ad_account_id").notNull(),
    platform: text("platform", {
      enum: ["meta", "google_ads", "tiktok", "snapchat", "linkedin"],
    })
      .notNull()
      .default("meta"),
    platformPayload: jsonb("platform_payload"),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    tokenType: text("token_type", { enum: ["system_user", "user_60d"] })
      .notNull()
      .default("system_user"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    currency: text("currency").notNull().default("AED"),
    timezone: text("timezone").notNull().default("Asia/Dubai"),
    monthlyCapAmount: numeric("monthly_cap_amount", { precision: 14, scale: 2 }),
    healthState: text("health_state", {
      enum: ["healthy", "warning", "error", "disconnected", "paused"],
    })
      .notNull()
      .default("healthy"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ad_accounts_slug_uq").on(t.slug),
    index("ad_accounts_client_idx").on(t.clientId),
  ]
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("api_tokens_hash_uq").on(t.tokenHash),
    index("api_tokens_user_idx").on(t.userId),
  ]
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    adAccountId: text("ad_account_id")
      .notNull()
      .references(() => adAccounts.id, { onDelete: "cascade" }),
    platformCampaignId: text("platform_campaign_id").notNull(),
    name: text("name").notNull(),
    status: text("status", {
      enum: ["ACTIVE", "PAUSED", "ARCHIVED", "DELETED"],
    }).notNull(),
    objective: text("objective"),
    buyingType: text("buying_type"),
    dailyBudget: numeric("daily_budget", { precision: 14, scale: 2 }),
    lifetimeBudget: numeric("lifetime_budget", { precision: 14, scale: 2 }),
    currency: text("currency").notNull().default("AED"),
    scheduleStart: timestamp("schedule_start", { withTimezone: true }),
    scheduleEnd: timestamp("schedule_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("campaigns_ad_account_platform_uq").on(
      t.adAccountId,
      t.platformCampaignId
    ),
  ]
);

export const adSets = pgTable(
  "ad_sets",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    platformAdsetId: text("platform_adset_id").notNull(),
    name: text("name").notNull(),
    status: text("status", {
      enum: ["ACTIVE", "PAUSED", "ARCHIVED", "DELETED"],
    }).notNull(),
    optimizationGoal: text("optimization_goal"),
    bidStrategy: text("bid_strategy"),
    dailyBudget: numeric("daily_budget", { precision: 14, scale: 2 }),
    lifetimeBudget: numeric("lifetime_budget", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ad_sets_campaign_platform_uq").on(t.campaignId, t.platformAdsetId),
  ]
);

export const ads = pgTable(
  "ads",
  {
    id: text("id").primaryKey(),
    adSetId: text("ad_set_id")
      .notNull()
      .references(() => adSets.id, { onDelete: "cascade" }),
    platformAdId: text("platform_ad_id").notNull(),
    name: text("name").notNull(),
    status: text("status", {
      enum: ["ACTIVE", "PAUSED", "ARCHIVED", "DELETED"],
    }).notNull(),
    format: text("format"),
    creativeId: text("creative_id"),
    thumbnailUrl: text("thumbnail_url"),
    bodyCopy: text("body_copy"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("ads_ad_set_platform_uq").on(t.adSetId, t.platformAdId)]
);

export const dailyInsights = pgTable(
  "daily_insights",
  {
    id: text("id").primaryKey(),
    adAccountId: text("ad_account_id")
      .notNull()
      .references(() => adAccounts.id, { onDelete: "cascade" }),
    entityLevel: text("entity_level", {
      enum: ["account", "campaign", "adset", "ad"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    date: date("date").notNull(),
    spend: numeric("spend", { precision: 14, scale: 2 }).notNull().default("0"),
    impressions: bigint("impressions", { mode: "number" }).notNull().default(0),
    reach: bigint("reach", { mode: "number" }).notNull().default(0),
    clicks: bigint("clicks", { mode: "number" }).notNull().default(0),
    ctr: numeric("ctr", { precision: 8, scale: 4 }),
    cpc: numeric("cpc", { precision: 10, scale: 4 }),
    cpm: numeric("cpm", { precision: 10, scale: 4 }),
    frequency: numeric("frequency", { precision: 8, scale: 4 }),
    purchases: integer("purchases").notNull().default(0),
    addToCart: integer("add_to_cart").notNull().default(0),
    initiateCheckout: integer("initiate_checkout").notNull().default(0),
    landingPageViews: integer("landing_page_views").notNull().default(0),
    revenue: numeric("revenue", { precision: 14, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("AED"),
  },
  (t) => [
    uniqueIndex("daily_insights_entity_date_uq").on(
      t.adAccountId,
      t.entityLevel,
      t.entityId,
      t.date
    ),
    index("daily_insights_entity_idx").on(t.entityLevel, t.entityId),
    index("daily_insights_account_date_idx").on(t.adAccountId, t.date),
  ]
);

export const syncJobs = pgTable(
  "sync_jobs",
  {
    id: text("id").primaryKey(),
    adAccountId: text("ad_account_id")
      .notNull()
      .references(() => adAccounts.id, { onDelete: "cascade" }),
    stage: text("stage", {
      enum: ["account_info", "campaigns", "ad_sets", "ads", "insights", "daily_series"],
    }).notNull(),
    status: text("status", { enum: ["running", "succeeded", "failed"] }).notNull(),
    errorClass: text("error_class"),
    detail: jsonb("detail"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    index("sync_jobs_account_started_idx").on(t.adAccountId, t.startedAt.desc()),
  ]
);

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),
    adAccountId: text("ad_account_id").references(() => adAccounts.id, {
      onDelete: "cascade",
    }),
    dedupeKey: text("dedupe_key").notNull(),
    triggerType: text("trigger_type", {
      enum: [
        "roas_drop",
        "cpa_spike",
        "spend_no_conversions",
        "creative_fatigue",
        "conversion_concentration",
        "token_expiring",
        "token_expired",
        "account_restricted",
      ],
    }).notNull(),
    severity: text("severity", { enum: ["critical", "warning", "info"] }).notNull(),
    entityLevel: text("entity_level", {
      enum: ["account", "campaign", "adset", "ad"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    entityName: text("entity_name").notNull().default(""),
    whatHappened: text("what_happened").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    supportingMetrics: jsonb("supporting_metrics"),
    recommendedAction: text("recommended_action").notNull(),
    ctaTarget: text("cta_target"),
    status: text("status", {
      enum: ["open", "snoozed", "acknowledged", "suppressed", "dismissed"],
    })
      .notNull()
      .default("open"),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    dismissedReason: text("dismissed_reason"),
    suppressedByTaskId: text("suppressed_by_task_id"),
    priorityScore: numeric("priority_score", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("alerts_dedupe_key_uq").on(t.dedupeKey),
    index("alerts_client_status_idx").on(t.clientId, t.status),
    index("alerts_ad_account_idx").on(t.adAccountId),
  ]
);

export const insights = pgTable(
  "insights",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),
    adAccountId: text("ad_account_id").references(() => adAccounts.id, {
      onDelete: "cascade",
    }),
    dedupeKey: text("dedupe_key").notNull(),
    insightType: text("insight_type", {
      enum: [
        "roas_drop",
        "cpa_spike",
        "spend_no_conversions",
        "creative_fatigue",
        "conversion_concentration",
      ],
    }).notNull(),
    severity: text("severity", { enum: ["critical", "warning", "info"] }).notNull(),
    entityLevel: text("entity_level", {
      enum: ["account", "campaign", "adset", "ad"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    entityName: text("entity_name").notNull().default(""),
    headline: text("headline").notNull(),
    deltaPct: numeric("delta_pct", { precision: 8, scale: 4 }),
    primaryCause: text("primary_cause"),
    attributionStatus: text("attribution_status", {
      enum: ["attributed", "unattributed"],
    })
      .notNull()
      .default("unattributed"),
    decomposition: jsonb("decomposition"),
    recommendedAction: text("recommended_action").notNull(),
    ctaTarget: text("cta_target"),
    acceptedAsTaskId: text("accepted_as_task_id"),
    notUsefulCount: integer("not_useful_count").notNull().default(0),
    priorityScore: numeric("priority_score", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("insights_dedupe_key_uq").on(t.dedupeKey),
    index("insights_client_idx").on(t.clientId),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    clientId: text("client_id").references(() => clients.id),
    adAccountId: text("ad_account_id").references(() => adAccounts.id, {
      onDelete: "set null",
    }),
    entityLevel: text("entity_level", {
      enum: ["account", "campaign", "adset", "ad", "client"],
    }),
    entityId: text("entity_id"),
    entityName: text("entity_name"),
    priority: text("priority", { enum: ["low", "medium", "high", "urgent"] })
      .notNull()
      .default("medium"),
    assigneeUserId: text("assignee_user_id").references(() => users.id),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: text("status", { enum: ["todo", "in_progress", "done", "skipped"] })
      .notNull()
      .default("todo"),
    source: text("source", { enum: ["manual", "alert", "recommendation"] })
      .notNull()
      .default("manual"),
    linkedAlertId: text("linked_alert_id"),
    linkedInsightId: text("linked_insight_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_status_idx").on(t.status), index("tasks_assignee_idx").on(t.assigneeUserId)]
);

export const revenueSources = pgTable(
  "revenue_sources",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceType: text("source_type", { enum: ["custom_api"] })
      .notNull()
      .default("custom_api"),
    ingestKeyHash: text("ingest_key_hash").notNull(),
    status: text("status", { enum: ["active", "revoked"] })
      .notNull()
      .default("active"),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("revenue_sources_ingest_key_hash_uq").on(t.ingestKeyHash),
    index("revenue_sources_client_idx").on(t.clientId),
  ]
);

export const revenueEvents = pgTable(
  "revenue_events",
  {
    id: text("id").primaryKey(),
    revenueSourceId: text("revenue_source_id")
      .notNull()
      .references(() => revenueSources.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    sourceOrderId: text("source_order_id").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    tsUtc: timestamp("ts_utc", { withTimezone: true }).notNull(),
    value: numeric("value", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("AED"),
    customerRef: text("customer_ref"),
    clickIds: jsonb("click_ids"),
    utm: jsonb("utm"),
    matchTier: text("match_tier", { enum: ["A", "B", "C"] }).notNull(),
    resolvedEntityLevel: text("resolved_entity_level", {
      enum: ["campaign", "adset", "ad"],
    }),
    resolvedEntityId: text("resolved_entity_id"),
    replacesEventId: text("replaces_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("revenue_events_dedupe_key_uq").on(t.dedupeKey),
    index("revenue_events_client_ts_idx").on(t.clientId, t.tsUtc),
    index("revenue_events_match_tier_idx").on(t.matchTier),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorType: text("actor_type", { enum: ["user", "api_token", "system"] })
      .notNull()
      .default("user"),
    action: text("action").notNull(),
    targetEntityType: text("target_entity_type"),
    targetEntityId: text("target_entity_id"),
    outcome: text("outcome", { enum: ["success", "failure"] })
      .notNull()
      .default("success"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_occurred_at_idx").on(t.occurredAt),
    index("audit_logs_actor_user_idx").on(t.actorUserId),
    index("audit_logs_action_idx").on(t.action),
  ]
);

export const clientUserAssignments = pgTable(
  "client_user_assignments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("client_user_assignments_user_uq").on(t.userId)]
);

export const retentionSettings = pgTable("retention_settings", {
  id: text("id").primaryKey(),
  rawInsightsDays: integer("raw_insights_days").notNull().default(90),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type AdAccount = typeof adAccounts.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type Pat = typeof apiTokens.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type AdSet = typeof adSets.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type DailyInsight = typeof dailyInsights.$inferSelect;
export type SyncJob = typeof syncJobs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Insight = typeof insights.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type RevenueSource = typeof revenueSources.$inferSelect;
export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ClientUserAssignment = typeof clientUserAssignments.$inferSelect;
export type RetentionSetting = typeof retentionSettings.$inferSelect;
