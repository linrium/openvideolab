ALTER TABLE "stories"
  DROP COLUMN IF EXISTS "story_summary";
--> statement-breakpoint
ALTER TABLE "story_pages"
  DROP COLUMN IF EXISTS "page_summary",
  DROP COLUMN IF EXISTS "key_events",
  DROP COLUMN IF EXISTS "mood";
--> statement-breakpoint
DROP INDEX IF EXISTS "story_panels_page_panel_number_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "story_panels_page_id_idx";
--> statement-breakpoint
DROP TABLE IF EXISTS "story_panels";
