import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { v7 as uuidv7 } from "uuid"
import type { PersistedVideoProvider } from "@/lib/video-provider"
import { users } from "./auth"
import { currentTimestampMs, timestampMs } from "./columns"
import { generations } from "./generations"

export interface PersistedVideoUsage {
  cost?: number | null
  isByok?: boolean
}

export type VideoCostType = "credit" | "money"

export const videos = sqliteTable(
  "videos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationId: text("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    prompt: text("prompt").notNull().default(""),
    model: text("model").notNull().default(""),
    referenceId: text("reference_id"),
    usage: text("usage", { mode: "json" }).$type<PersistedVideoUsage | null>(),
    costType: text("cost_type").$type<VideoCostType | null>(),
    estimatedCost: text("estimated_cost"),
    totalCost: text("total_cost"),
    generationTime: text("generation_time"),
    latency: text("latency"),
    jobId: text("job_id").notNull().unique(),
    aspectRatio: text("aspect_ratio"),
    resolution: text("resolution"),
    duration: integer("duration"),
    inputVideoDuration: integer("input_video_duration"),
    generateAudio: integer("generate_audio", { mode: "boolean" })
      .notNull()
      .default(true),
    path: text("path"),
    inputReferences: text("input_references", { mode: "json" }).$type<
      string[]
    >(),
    frameFirst: text("frame_first"),
    frameLast: text("frame_last"),
    provider: text("provider", {
      mode: "json",
    }).$type<PersistedVideoProvider | null>(),
    elapsed: integer("elapsed").notNull().default(0),
    createdAt: timestampMs("created_at").default(currentTimestampMs).notNull(),
    updatedAt: timestampMs("updated_at").default(currentTimestampMs).notNull(),
  },
  (t) => [
    index("videos_user_id_idx").on(t.userId),
    index("videos_generation_id_idx").on(t.generationId),
  ]
)

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  generation: one(generations, {
    fields: [videos.generationId],
    references: [generations.id],
  }),
}))

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
