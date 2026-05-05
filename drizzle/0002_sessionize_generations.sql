ALTER TABLE "images"
  ADD COLUMN "batch_id" uuid,
  ADD COLUMN "status" text DEFAULT 'completed' NOT NULL,
  ADD COLUMN "error" text,
  ADD COLUMN "title" text DEFAULT '' NOT NULL,
  ADD COLUMN "prompt" text DEFAULT '' NOT NULL,
  ADD COLUMN "model" text DEFAULT '' NOT NULL,
  ADD COLUMN "reference_id" text,
  ADD COLUMN "usage" jsonb,
  ADD COLUMN "estimated_cost" numeric(12, 6),
  ADD COLUMN "total_cost" numeric(12, 6),
  ADD COLUMN "generation_time" numeric(12, 3),
  ADD COLUMN "latency" numeric(12, 3),
  ADD COLUMN "quality" text,
  ADD COLUMN "size" text;
--> statement-breakpoint
UPDATE "images"
SET
  "batch_id" = "images"."generation_id",
  "status" = "generations"."status",
  "error" = "generations"."error",
  "title" = "generations"."title",
  "prompt" = "generations"."prompt",
  "model" = "generations"."model",
  "reference_id" = "generations"."reference_id",
  "usage" = "generations"."usage" -> 'provider',
  "estimated_cost" = "generations"."estimated_cost",
  "total_cost" = "generations"."total_cost",
  "generation_time" = "generations"."generation_time",
  "latency" = "generations"."latency",
  "quality" = "generations"."usage" -> 'image' ->> 'quality',
  "size" = "generations"."usage" -> 'image' ->> 'size',
  "created_at" = "generations"."created_at",
  "updated_at" = "generations"."updated_at"
FROM "generations"
WHERE "images"."generation_id" = "generations"."id";
--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "batch_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "images_batch_id_idx" ON "images" USING btree ("batch_id");
--> statement-breakpoint
ALTER TABLE "videos"
  ADD COLUMN "status" text DEFAULT 'pending' NOT NULL,
  ADD COLUMN "error" text,
  ADD COLUMN "title" text DEFAULT '' NOT NULL,
  ADD COLUMN "prompt" text DEFAULT '' NOT NULL,
  ADD COLUMN "model" text DEFAULT '' NOT NULL,
  ADD COLUMN "reference_id" text,
  ADD COLUMN "usage" jsonb,
  ADD COLUMN "estimated_cost" numeric(12, 6),
  ADD COLUMN "total_cost" numeric(12, 6),
  ADD COLUMN "generation_time" numeric(12, 3),
  ADD COLUMN "latency" numeric(12, 3),
  ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "videos"
SET
  "status" = "generations"."status",
  "error" = "generations"."error",
  "title" = "generations"."title",
  "prompt" = "generations"."prompt",
  "model" = "generations"."model",
  "reference_id" = "generations"."reference_id",
  "usage" = "generations"."usage" -> 'provider',
  "estimated_cost" = "generations"."estimated_cost",
  "total_cost" = "generations"."total_cost",
  "generation_time" = "generations"."generation_time",
  "latency" = "generations"."latency",
  "created_at" = "generations"."created_at",
  "updated_at" = "generations"."updated_at"
FROM "generations"
WHERE "videos"."generation_id" = "generations"."id";
--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_generation_record_id_unique";
--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_generation_id_unique";
--> statement-breakpoint
CREATE INDEX "videos_generation_id_idx" ON "videos" USING btree ("generation_id");
--> statement-breakpoint
ALTER TABLE "generations"
  DROP COLUMN IF EXISTS "error",
  DROP COLUMN IF EXISTS "reference_id",
  DROP COLUMN IF EXISTS "usage",
  DROP COLUMN IF EXISTS "estimated_cost",
  DROP COLUMN IF EXISTS "total_cost",
  DROP COLUMN IF EXISTS "generation_time",
  DROP COLUMN IF EXISTS "latency";
