import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"
import type { PersistedVideoProvider } from "@/lib/video-provider"
import { users } from "./auth"
import { generations } from "./generations"

export interface PersistedVideoUsage {
  cost?: number | null
  isByok?: boolean
}

export type VideoCostType = "credit" | "money"

export const videos = pgTable(
  "videos",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    prompt: text("prompt").notNull().default(""),
    model: text("model").notNull().default(""),
    referenceId: text("reference_id"),
    usage: jsonb("usage").$type<PersistedVideoUsage | null>(),
    costType: text("cost_type").$type<VideoCostType | null>(),
    estimatedCost: numeric("estimated_cost", { precision: 12, scale: 6 }),
    totalCost: numeric("total_cost", { precision: 12, scale: 6 }),
    generationTime: numeric("generation_time", { precision: 12, scale: 3 }),
    latency: numeric("latency", { precision: 12, scale: 3 }),
    jobId: text("job_id").notNull().unique(),
    aspectRatio: text("aspect_ratio"),
    resolution: text("resolution"),
    duration: integer("duration"),
    inputVideoDuration: integer("input_video_duration"),
    generateAudio: boolean("generate_audio").notNull().default(true),
    path: text("path"),
    inputReferences: text("input_references").array(),
    frameFirst: text("frame_first"),
    frameLast: text("frame_last"),
    provider: jsonb("provider").$type<PersistedVideoProvider | null>(),
    elapsed: integer("elapsed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
