ALTER TABLE "ad_accounts" ADD COLUMN "token_type" text DEFAULT 'system_user' NOT NULL;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD COLUMN "token_expires_at" timestamp with time zone;