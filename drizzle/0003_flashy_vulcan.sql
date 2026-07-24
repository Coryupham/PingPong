CREATE TYPE "public"."tournament_status" AS ENUM('active', 'complete');--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"team_count" integer NOT NULL,
	"players_per_team" integer NOT NULL,
	"teams" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rounds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"status" "tournament_status" DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_team_count_bounds" CHECK ("tournaments"."team_count" >= 2),
	CONSTRAINT "tournaments_players_per_team_bounds" CHECK ("tournaments"."players_per_team" >= 1),
	CONSTRAINT "tournaments_current_round_bounds" CHECK ("tournaments"."current_round" >= 1)
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "tournament_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "tournament_round" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "tournament_match_id" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournaments_recent_idx" ON "tournaments" USING btree ("created_at");