import { relations } from "drizzle-orm"
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"
import type { PersistedVideoProvider } from "@/lib/video-provider"
import { generations } from "./generations"

export const videos = pgTable("videos", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  generationRecordId: uuid("generation_record_id")
    .notNull()
    .unique()
    .references(() => generations.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().unique(),
  aspectRatio: text("aspect_ratio"),
  resolution: text("resolution"),
  duration: integer("duration"),
  generateAudio: boolean("generate_audio").notNull().default(true),
  path: text("path"),
  inputReferences: text("input_references").array(),
  frameFirst: text("frame_first"),
  frameLast: text("frame_last"),
  provider: jsonb("provider").$type<PersistedVideoProvider | null>(),
  elapsed: integer("elapsed").notNull().default(0),
})

export const videosRelations = relations(videos, ({ one }) => ({
  generation: one(generations, {
    fields: [videos.generationRecordId],
    references: [generations.id],
  }),
}))

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
