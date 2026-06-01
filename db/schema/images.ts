import { relations, sql } from "drizzle-orm"
import {
  check,
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
import type { ImageMode, ImageQuality, ImageSize } from "@/lib/image-generation"
import { users } from "./auth"
import { generations } from "./generations"

export interface PersistedImageUsage {
  provider?: {
    inputTokens?: number
    inputTokensDetails?: {
      imageTokens?: number
      textTokens?: number
    }
    outputTokens?: number
    outputTokensDetails?: {
      imageTokens?: number
      textTokens?: number
    }
    totalTokens?: number
  }
}

export const images = pgTable(
  "images",
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
    batchId: uuid("batch_id")
      .notNull()
      .$defaultFn(() => uuidv7()),
    status: text("status").notNull().default("completed"),
    error: text("error"),
    prompt: text("prompt").notNull().default(""),
    model: text("model").notNull().default(""),
    referenceId: text("reference_id"),
    usage: jsonb("usage").$type<PersistedImageUsage | null>(),
    estimatedCost: numeric("estimated_cost", { precision: 12, scale: 6 }),
    totalCost: numeric("total_cost", { precision: 12, scale: 6 }),
    generationTime: numeric("generation_time", { precision: 12, scale: 3 }),
    latency: numeric("latency", { precision: 12, scale: 3 }),
    quality: text("quality").$type<ImageQuality | null>(),
    size: text("size").$type<ImageSize | null>(),
    mode: text("mode").$type<ImageMode | null>(),
    inputFidelity: text("input_fidelity"),
    sourceImages: text("source_images").array(),
    mask: text("mask"),
    path: text("path"),
    sourceUrl: text("source_url"),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("images_user_id_idx").on(t.userId),
    index("images_generation_id_idx").on(t.generationId),
    index("images_batch_id_idx").on(t.batchId),
    check(
      "images_input_fidelity_check",
      sql`${t.inputFidelity} IS NULL OR ${t.inputFidelity} IN ('low', 'high')`
    ),
  ]
)

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  generation: one(generations, {
    fields: [images.generationId],
    references: [generations.id],
  }),
}))

export type Image = typeof images.$inferSelect
export type NewImage = typeof images.$inferInsert
