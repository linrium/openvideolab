import { relations } from "drizzle-orm"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { users } from "./auth"
import { currentTimestampMs, timestampMs } from "./columns"

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  cloudflareAccessKeyId: text("cloudflare_access_key_id"),
  cloudflareR2EndpointUrl: text("cloudflare_r2_endpoint_url"),
  cloudflareSecretAccessKey: text("cloudflare_secret_access_key"),
  deepseekApiKey: text("deepseek_api_key"),
  atlasCloudApiKey: text("atlas_cloud_api_key"),
  kieApiKey: text("kie_api_key"),
  openrouterApiKey: text("openrouter_api_key"),
  openaiApiKey: text("openai_api_key"),
  createdAt: timestampMs("created_at").default(currentTimestampMs).notNull(),
  updatedAt: timestampMs("updated_at")
    .default(currentTimestampMs)
    .$onUpdate(() => new Date())
    .notNull(),
})

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}))

export type UserSettings = typeof userSettings.$inferSelect
export type NewUserSettings = typeof userSettings.$inferInsert
