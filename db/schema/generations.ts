import { relations, sql } from "drizzle-orm"
import {
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"
import { users } from "./auth"

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

export const generations = pgTable(
  "generations",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    title: text("title").notNull().default(""),
    prompt: text("prompt").notNull().default(""),
    model: text("model").notNull(),
    referenceId: text("reference_id"),
    estimatedCost: numeric("estimated_cost", { precision: 12, scale: 6 }),
    totalCost: numeric("total_cost", { precision: 12, scale: 6 }),
    generationTime: numeric("generation_time", { precision: 12, scale: 3 }),
    latency: numeric("latency", { precision: 12, scale: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
