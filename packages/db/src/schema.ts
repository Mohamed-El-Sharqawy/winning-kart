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
