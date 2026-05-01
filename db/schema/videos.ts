import { sql } from "drizzle-orm"
import {
  check,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"

export const videos = pgTable(
  "videos",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    jobId: text("job_id").notNull().unique(),
    generationId: text("generation_id"),
    status: text("status").notNull().default("pending"),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    cost: numeric("cost", { precision: 12, scale: 6 }),
    path: text("path"),
    elapsed: integer("elapsed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "videos_status_check",
      sql`${t.status} IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'expired')`
    ),
  ]
)

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
