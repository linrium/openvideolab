CREATE TABLE IF NOT EXISTS "stories" (
  "id" uuid PRIMARY KEY NOT NULL,
  "generation_id" uuid NOT NULL UNIQUE,
  "source_prompt" text DEFAULT '' NOT NULL,
  "source_url" text,
  "title" text DEFAULT '' NOT NULL,
  "story_summary" text DEFAULT '' NOT NULL,
  "visual_direction" text DEFAULT '' NOT NULL,
  "style_notes" text[] DEFAULT '{}' NOT NULL,
  "characters" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "page_count" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "stories_generation_id_generations_id_fk"
    FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_pages" (
  "id" uuid PRIMARY KEY NOT NULL,
  "story_id" uuid NOT NULL,
  "page_number" integer NOT NULL,
  "panel_count" integer NOT NULL,
  "page_summary" text DEFAULT '' NOT NULL,
  "key_events" text[] DEFAULT '{}' NOT NULL,
  "characters" text[] DEFAULT '{}' NOT NULL,
  "setting" text DEFAULT '' NOT NULL,
  "mood" text DEFAULT '' NOT NULL,
  "camera_language" text DEFAULT '' NOT NULL,
  "image_prompt" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "story_pages_story_id_stories_id_fk"
    FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_panels" (
  "id" uuid PRIMARY KEY NOT NULL,
  "page_id" uuid NOT NULL,
  "panel_number" integer NOT NULL,
  "summary" text DEFAULT '' NOT NULL,
  "action" text DEFAULT '' NOT NULL,
  "shot_type" text DEFAULT '' NOT NULL,
  "dialogue" text,
  "narration" text,
  "characters" text[] DEFAULT '{}' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "story_panels_page_id_story_pages_id_fk"
    FOREIGN KEY ("page_id") REFERENCES "public"."story_pages"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stories_generation_id_idx"
  ON "stories" USING btree ("generation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_pages_story_id_idx"
  ON "story_pages" USING btree ("story_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_pages_story_page_number_idx"
  ON "story_pages" USING btree ("story_id","page_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_panels_page_id_idx"
  ON "story_panels" USING btree ("page_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_panels_page_panel_number_idx"
  ON "story_panels" USING btree ("page_id","panel_number");
