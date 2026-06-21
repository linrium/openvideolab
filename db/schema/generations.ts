import { relations, sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"
import { v7 as uuidv7 } from "uuid"
import { users } from "./auth"
import { currentTimestampMs, timestampMs } from "./columns"

export const GENERATION_TYPES = [
  "video",
  "image",
  "storyboard",
  "music",
] as const

export const GENERATION_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const

export const generations = sqliteTable(
  "generations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("pending"),
    title: text("title").notNull().default(""),
    count: integer("count").notNull().default(1),
    createdAt: timestampMs("created_at").default(currentTimestampMs).notNull(),
    updatedAt: timestampMs("updated_at").default(currentTimestampMs).notNull(),
    publishedAt: timestampMs("published_at"),
  },
  (t) => [
    index("generations_user_id_idx").on(t.userId),
    index("generations_type_idx").on(t.type),
    check(
      "generations_status_check",
      sql`${t.status} IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'expired')`
    ),
    check(
      "generations_type_check",
      sql`${t.type} IN ('video', 'image', 'storyboard', 'music')`
    ),
  ]
)

export const generationsRelations = relations(generations, ({ one }) => ({
  user: one(users, {
    fields: [generations.userId],
    references: [users.id],
  }),
}))

export type Generation = typeof generations.$inferSelect
export type NewGeneration = typeof generations.$inferInsert
