CREATE TABLE "story_characters" (
  "id" uuid PRIMARY KEY NOT NULL,
  "story_id" uuid NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "image_id" uuid REFERENCES "images"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "story_characters_story_id_name_unique" UNIQUE ("story_id", "name")
);

CREATE INDEX "story_characters_story_id_idx" ON "story_characters" ("story_id");
