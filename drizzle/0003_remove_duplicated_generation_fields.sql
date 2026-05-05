ALTER TABLE "generations"
  DROP COLUMN IF EXISTS "prompt",
  DROP COLUMN IF EXISTS "model";
--> statement-breakpoint
ALTER TABLE "images"
  DROP COLUMN IF EXISTS "title";
--> statement-breakpoint
ALTER TABLE "videos"
  DROP COLUMN IF EXISTS "title";
