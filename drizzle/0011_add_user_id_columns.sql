-- Add user_id to images
ALTER TABLE "images" ADD COLUMN "user_id" text;
UPDATE "images" SET "user_id" = g."user_id" FROM "generations" g WHERE "images"."generation_id" = g."id";
ALTER TABLE "images" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "images_user_id_idx" ON "images" ("user_id");

-- Add user_id to videos
ALTER TABLE "videos" ADD COLUMN "user_id" text;
UPDATE "videos" SET "user_id" = g."user_id" FROM "generations" g WHERE "videos"."generation_id" = g."id";
ALTER TABLE "videos" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "videos_user_id_idx" ON "videos" ("user_id");

-- Add user_id to stories
ALTER TABLE "stories" ADD COLUMN "user_id" text;
UPDATE "stories" SET "user_id" = g."user_id" FROM "generations" g WHERE "stories"."generation_id" = g."id";
ALTER TABLE "stories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "stories_user_id_idx" ON "stories" ("user_id");

-- Add user_id to story_pages
ALTER TABLE "story_pages" ADD COLUMN "user_id" text;
UPDATE "story_pages" SET "user_id" = s."user_id" FROM "stories" s WHERE "story_pages"."story_id" = s."id";
ALTER TABLE "story_pages" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "story_pages" ADD CONSTRAINT "story_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "story_pages_user_id_idx" ON "story_pages" ("user_id");

-- Add user_id to story_characters
ALTER TABLE "story_characters" ADD COLUMN "user_id" text;
UPDATE "story_characters" SET "user_id" = s."user_id" FROM "stories" s WHERE "story_characters"."story_id" = s."id";
ALTER TABLE "story_characters" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "story_characters" ADD CONSTRAINT "story_characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
