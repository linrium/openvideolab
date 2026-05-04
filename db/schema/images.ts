import { relations } from "drizzle-orm"
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"
import { generations } from "./generations"

export const images = pgTable(
  "images",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    path: text("path"),
    sourceUrl: text("source_url"),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("images_generation_id_idx").on(t.generationId)]
)

export const imagesRelations = relations(images, ({ one }) => ({
  generation: one(generations, {
    fields: [images.generationId],
    references: [generations.id],
  }),
}))

export type Image = typeof images.$inferSelect
export type NewImage = typeof images.$inferInsert
