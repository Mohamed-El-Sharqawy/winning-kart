CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_type" text DEFAULT 'user' NOT NULL,
	"action" text NOT NULL,
	"target_entity_type" text,
	"target_entity_id" text,
	"outcome" text DEFAULT 'success' NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip" text,
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_user_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"raw_insights_days" integer DEFAULT 90 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_events" (
	"id" text PRIMARY KEY NOT NULL,
	"revenue_source_id" text NOT NULL,
	"client_id" text NOT NULL,
	"source_order_id" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"ts_utc" timestamp with time zone NOT NULL,
	"value" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"customer_ref" text,
	"click_ids" jsonb,
	"utm" jsonb,
	"match_tier" text NOT NULL,
	"resolved_entity_level" text,
	"resolved_entity_id" text,
	"replaces_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"source_type" text DEFAULT 'custom_api' NOT NULL,
	"ingest_key_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_user_assignments" ADD CONSTRAINT "client_user_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_user_assignments" ADD CONSTRAINT "client_user_assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_revenue_source_id_revenue_sources_id_fk" FOREIGN KEY ("revenue_source_id") REFERENCES "public"."revenue_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_sources" ADD CONSTRAINT "revenue_sources_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "client_user_assignments_user_uq" ON "client_user_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_events_dedupe_key_uq" ON "revenue_events" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "revenue_events_client_ts_idx" ON "revenue_events" USING btree ("client_id","ts_utc");--> statement-breakpoint
CREATE INDEX "revenue_events_match_tier_idx" ON "revenue_events" USING btree ("match_tier");--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_sources_ingest_key_hash_uq" ON "revenue_sources" USING btree ("ingest_key_hash");--> statement-breakpoint
CREATE INDEX "revenue_sources_client_idx" ON "revenue_sources" USING btree ("client_id");