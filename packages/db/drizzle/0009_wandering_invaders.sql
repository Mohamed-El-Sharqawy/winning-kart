ALTER TABLE "ad_sets" ADD COLUMN "platform_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "platform_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "platform_updated_at" timestamp with time zone;