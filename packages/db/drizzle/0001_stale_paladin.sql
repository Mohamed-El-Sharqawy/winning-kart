CREATE TABLE "ad_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"platform_adset_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"optimization_goal" text,
	"bid_strategy" text,
	"daily_budget" numeric(14, 2),
	"lifetime_budget" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ads" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_set_id" text NOT NULL,
	"platform_ad_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"format" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_account_id" text NOT NULL,
	"platform_campaign_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"objective" text,
	"buying_type" text,
	"daily_budget" numeric(14, 2),
	"lifetime_budget" numeric(14, 2),
	"currency" text DEFAULT 'AED' NOT NULL,
	"schedule_start" timestamp with time zone,
	"schedule_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_account_id" text NOT NULL,
	"entity_level" text NOT NULL,
	"entity_id" text NOT NULL,
	"date" date NOT NULL,
	"spend" numeric(14, 2) DEFAULT '0' NOT NULL,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"reach" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"ctr" numeric(8, 4),
	"cpc" numeric(10, 4),
	"cpm" numeric(10, 4),
	"frequency" numeric(8, 4),
	"purchases" integer DEFAULT 0 NOT NULL,
	"revenue" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_account_id" text NOT NULL,
	"stage" text NOT NULL,
	"status" text NOT NULL,
	"error_class" text,
	"detail" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_ad_set_id_ad_sets_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."ad_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_insights" ADD CONSTRAINT "daily_insights_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ad_sets_campaign_platform_uq" ON "ad_sets" USING btree ("campaign_id","platform_adset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ads_ad_set_platform_uq" ON "ads" USING btree ("ad_set_id","platform_ad_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_ad_account_platform_uq" ON "campaigns" USING btree ("ad_account_id","platform_campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_insights_entity_date_uq" ON "daily_insights" USING btree ("ad_account_id","entity_level","entity_id","date");--> statement-breakpoint
CREATE INDEX "daily_insights_entity_idx" ON "daily_insights" USING btree ("entity_level","entity_id");--> statement-breakpoint
CREATE INDEX "sync_jobs_account_started_idx" ON "sync_jobs" USING btree ("ad_account_id","started_at" DESC NULLS LAST);