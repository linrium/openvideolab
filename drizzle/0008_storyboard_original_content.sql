ALTER TABLE "story_pages"
  DROP COLUMN IF EXISTS "setting",
  DROP COLUMN IF EXISTS "camera_language";
--> statement-breakpoint
ALTER TABLE "story_pages"
  ADD COLUMN IF NOT EXISTS "original_content" text DEFAULT '' NOT NULL;
