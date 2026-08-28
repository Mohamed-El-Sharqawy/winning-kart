CREATE TABLE "sync_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_account_id" text NOT NULL,
	"status" text NOT NULL,
	"progress" jsonb,
	"error" text,
	"error_class" text,
	"graph_calls" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_runs_account_created_idx" ON "sync_runs" USING btree ("ad_account_id","created_at" DESC NULLS LAST);