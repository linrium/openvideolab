import { relations, sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"
import { v7 as uuidv7 } from "uuid"
import type {
  ImageBackground,
  ImageMode,
  ImageModeration,
  ImageQuality,
  ImageSize,
} from "@/lib/image-generation"
import { users } from "./auth"
import { currentTimestampMs, timestampMs } from "./columns"
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

export const images = sqliteTable(
  "images",
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
    batchId: text("batch_id")
      .notNull()
      .$defaultFn(() => uuidv7()),
    status: text("status").notNull().default("completed"),
    error: text("error"),
    prompt: text("prompt").notNull().default(""),
    model: text("model").notNull().default(""),
    referenceId: text("reference_id"),
    usage: text("usage", { mode: "json" }).$type<PersistedImageUsage | null>(),
    estimatedCost: text("estimated_cost"),
    totalCost: text("total_cost"),
    generationTime: text("generation_time"),
    latency: text("latency"),
    count: integer("count"),
    background: text("background").$type<ImageBackground | null>(),
    moderation: text("moderation").$type<ImageModeration | null>(),
    quality: text("quality").$type<ImageQuality | null>(),
    size: text("size").$type<ImageSize | null>(),
    mode: text("mode").$type<ImageMode | null>(),
    inputFidelity: text("input_fidelity"),
    sourceImages: text("source_images", { mode: "json" }).$type<string[]>(),
    mask: text("mask"),
    path: text("path"),
    sourceUrl: text("source_url"),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
    publishedAt: timestampMs("published_at"),
    createdAt: timestampMs("created_at").default(currentTimestampMs).notNull(),
    updatedAt: timestampMs("updated_at").default(currentTimestampMs).notNull(),
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
