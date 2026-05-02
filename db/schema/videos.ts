import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"
import { users } from "./auth-schema"

export const videos = pgTable(
  "videos",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    jobId: text("job_id").notNull().unique(),
    generationId: text("generation_id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    title: text("title").notNull().default(""),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio"),
    resolution: text("resolution"),
    duration: integer("duration"),
    generateAudio: boolean("generate_audio").notNull().default(true),
    cost: numeric("cost", { precision: 12, scale: 6 }),
    path: text("path"),
    inputReferences: text("input_references").array(),
    frameFirst: text("frame_first"),
    frameLast: text("frame_last"),
    elapsed: integer("elapsed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("videos_userId_idx").on(t.userId),
    check(
      "videos_status_check",
      sql`${t.status} IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'expired')`
    ),
  ]
)

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
}))

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
