import { relations } from "drizzle-orm"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { v7 as uuidv7 } from "uuid"
import { generations } from "./generations"

export interface PersistedStoryCharacter {
  name: string
  role: string
}

export const stories = pgTable(
  "stories",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    generationId: uuid("generation_id")
      .notNull()
      .unique()
      .references(() => generations.id, { onDelete: "cascade" }),
    sourcePrompt: text("source_prompt").notNull().default(""),
    sourceUrl: text("source_url"),
    title: text("title").notNull().default(""),
    styleNotes: text("style_notes").array().notNull().default([]),
    characters: jsonb("characters")
      .$type<PersistedStoryCharacter[]>()
      .notNull()
      .default([]),
    pageCount: integer("page_count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("stories_generation_id_idx").on(t.generationId)]
)

export const storyPages = pgTable(
  "story_pages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    panelCount: integer("panel_count").notNull(),
    characters: text("characters").array().notNull().default([]),
    originalContent: text("original_content").notNull().default(""),
    imagePrompt: text("image_prompt").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("story_pages_story_id_idx").on(t.storyId),
    index("story_pages_story_page_number_idx").on(t.storyId, t.pageNumber),
  ]
)

export const storiesRelations = relations(stories, ({ many, one }) => ({
  generation: one(generations, {
    fields: [stories.generationId],
    references: [generations.id],
  }),
  pages: many(storyPages),
}))

export const storyPagesRelations = relations(storyPages, ({ one }) => ({
  story: one(stories, {
    fields: [storyPages.storyId],
    references: [stories.id],
  }),
}))

export type Story = typeof stories.$inferSelect
export type NewStory = typeof stories.$inferInsert
export type StoryPage = typeof storyPages.$inferSelect
export type NewStoryPage = typeof storyPages.$inferInsert
