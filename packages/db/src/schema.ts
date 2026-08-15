import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  boolean,
  numeric,
  jsonb,
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

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type AdAccount = typeof adAccounts.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type Pat = typeof apiTokens.$inferSelect;
