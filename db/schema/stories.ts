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
  description: string
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
    storySummary: text("story_summary").notNull().default(""),
    visualDirection: text("visual_direction").notNull().default(""),
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
    pageSummary: text("page_summary").notNull().default(""),
    keyEvents: text("key_events").array().notNull().default([]),
    characters: text("characters").array().notNull().default([]),
    setting: text("setting").notNull().default(""),
    mood: text("mood").notNull().default(""),
    cameraLanguage: text("camera_language").notNull().default(""),
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

export const storyPanels = pgTable(
  "story_panels",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    pageId: uuid("page_id")
      .notNull()
      .references(() => storyPages.id, { onDelete: "cascade" }),
    panelNumber: integer("panel_number").notNull(),
    summary: text("summary").notNull().default(""),
    action: text("action").notNull().default(""),
    shotType: text("shot_type").notNull().default(""),
    dialogue: text("dialogue"),
    narration: text("narration"),
    characters: text("characters").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("story_panels_page_id_idx").on(t.pageId),
    index("story_panels_page_panel_number_idx").on(t.pageId, t.panelNumber),
  ]
)

export const storiesRelations = relations(stories, ({ many, one }) => ({
  generation: one(generations, {
    fields: [stories.generationId],
    references: [generations.id],
  }),
  pages: many(storyPages),
}))

export const storyPagesRelations = relations(storyPages, ({ many, one }) => ({
  panels: many(storyPanels),
  story: one(stories, {
    fields: [storyPages.storyId],
    references: [stories.id],
  }),
}))

export const storyPanelsRelations = relations(storyPanels, ({ one }) => ({
  page: one(storyPages, {
    fields: [storyPanels.pageId],
    references: [storyPages.id],
  }),
}))

export type Story = typeof stories.$inferSelect
export type NewStory = typeof stories.$inferInsert
export type StoryPage = typeof storyPages.$inferSelect
export type NewStoryPage = typeof storyPages.$inferInsert
export type StoryPanel = typeof storyPanels.$inferSelect
export type NewStoryPanel = typeof storyPanels.$inferInsert
