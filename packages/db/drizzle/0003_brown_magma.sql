ALTER TABLE "ads" ADD COLUMN "creative_id" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "body_copy" text;--> statement-breakpoint
ALTER TABLE "daily_insights" ADD COLUMN "add_to_cart" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_insights" ADD COLUMN "initiate_checkout" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_insights" ADD COLUMN "landing_page_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "daily_insights_account_date_idx" ON "daily_insights" USING btree ("ad_account_id","date");