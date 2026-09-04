WITH purged AS (
  SELECT id FROM ads WHERE status IN ('ARCHIVED', 'DELETED')
  UNION
  SELECT id FROM ad_sets WHERE status IN ('ARCHIVED', 'DELETED')
  UNION
  SELECT id FROM campaigns WHERE status IN ('ARCHIVED', 'DELETED')
  UNION
  SELECT a.id FROM ads a JOIN ad_sets s ON a.ad_set_id = s.id WHERE s.status IN ('ARCHIVED', 'DELETED')
  UNION
  SELECT s.id FROM ad_sets s JOIN campaigns c ON s.campaign_id = c.id WHERE c.status IN ('ARCHIVED', 'DELETED')
)
DELETE FROM daily_insights di USING purged WHERE di.entity_level <> 'account' AND di.entity_id = purged.id;--> statement-breakpoint
DELETE FROM ads WHERE status IN ('ARCHIVED', 'DELETED') OR ad_set_id IN (SELECT id FROM ad_sets WHERE status IN ('ARCHIVED', 'DELETED'));--> statement-breakpoint
DELETE FROM ad_sets WHERE status IN ('ARCHIVED', 'DELETED') OR campaign_id IN (SELECT id FROM campaigns WHERE status IN ('ARCHIVED', 'DELETED'));--> statement-breakpoint
DELETE FROM campaigns WHERE status IN ('ARCHIVED', 'DELETED');--> statement-breakpoint
UPDATE "campaigns" SET "status" = 'UNKNOWN' WHERE "status" = 'PAUSED';--> statement-breakpoint
UPDATE "ad_sets" SET "status" = 'UNKNOWN' WHERE "status" = 'PAUSED';--> statement-breakpoint
UPDATE "ads" SET "status" = 'UNKNOWN' WHERE "status" = 'PAUSED';--> statement-breakpoint
UPDATE "ads" SET "format" = 'IMAGE' WHERE "format" IS NULL;--> statement-breakpoint
ALTER TABLE "ads" DROP COLUMN "preview_image_url";--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "video_id" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "effective_story_id" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "carousel_count" integer;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "thumbnail_resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "poster_url" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "poster_resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "source_resolved_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "daily_insights_window_idx" ON "daily_insights" USING btree ("ad_account_id","entity_level","date");--> statement-breakpoint
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_status_check" CHECK ("ad_sets"."status" in ('ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'WITH_ISSUES', 'IN_PROCESS', 'UNKNOWN'));--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_status_check" CHECK ("ads"."status" in ('ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'WITH_ISSUES', 'IN_PROCESS', 'UNKNOWN'));--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_format_check" CHECK ("ads"."format" in ('IMAGE', 'VIDEO', 'CAROUSEL'));--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_status_check" CHECK ("campaigns"."status" in ('ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'WITH_ISSUES', 'IN_PROCESS', 'UNKNOWN'));
