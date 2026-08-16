CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"ad_account_id" text,
	"dedupe_key" text NOT NULL,
	"trigger_type" text NOT NULL,
	"severity" text NOT NULL,
	"entity_level" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text DEFAULT '' NOT NULL,
	"what_happened" text NOT NULL,
	"why_it_matters" text NOT NULL,
	"supporting_metrics" jsonb,
	"recommended_action" text NOT NULL,
	"cta_target" text,
	"status" text DEFAULT 'open' NOT NULL,
	"snoozed_until" timestamp with time zone,
	"dismissed_reason" text,
	"suppressed_by_task_id" text,
	"priority_score" numeric(14, 2) DEFAULT '0' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"ad_account_id" text,
	"dedupe_key" text NOT NULL,
	"insight_type" text NOT NULL,
	"severity" text NOT NULL,
	"entity_level" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text DEFAULT '' NOT NULL,
	"headline" text NOT NULL,
	"delta_pct" numeric(8, 4),
	"primary_cause" text,
	"attribution_status" text DEFAULT 'unattributed' NOT NULL,
	"decomposition" jsonb,
	"recommended_action" text NOT NULL,
	"cta_target" text,
	"accepted_as_task_id" text,
	"not_useful_count" integer DEFAULT 0 NOT NULL,
	"priority_score" numeric(14, 2) DEFAULT '0' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"client_id" text,
	"ad_account_id" text,
	"entity_level" text,
	"entity_id" text,
	"entity_name" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee_user_id" text,
	"due_date" timestamp with time zone,
	"status" text DEFAULT 'todo' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"linked_alert_id" text,
	"linked_insight_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_dedupe_key_uq" ON "alerts" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "alerts_client_status_idx" ON "alerts" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "alerts_ad_account_idx" ON "alerts" USING btree ("ad_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "insights_dedupe_key_uq" ON "insights" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "insights_client_idx" ON "insights" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assignee_user_id");