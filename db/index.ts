import { drizzle } from "drizzle-orm/neon-http"
import {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
} from "@/db/schema/auth"
import { generations, generationsRelations } from "@/db/schema/generations"
import { images, imagesRelations } from "@/db/schema/images"
import {
  stories,
  storiesRelations,
  storyCharacters,
  storyCharactersRelations,
  storyPages,
  storyPagesRelations,
} from "@/db/schema/stories"
import { userSettings, userSettingsRelations } from "@/db/schema/user-settings"
import { videos, videosRelations } from "@/db/schema/videos"

const schema = {
  accounts,
  accountsRelations,
  generations,
  generationsRelations,
  images,
  imagesRelations,
  sessions,
  sessionsRelations,
  stories,
  storiesRelations,
  storyCharacters,
  storyCharactersRelations,
  storyPages,
  storyPagesRelations,
  userSettings,
  userSettingsRelations,
  users,
  usersRelations,
  verifications,
  videos,
  videosRelations,
}

export const db = drizzle(process.env.DATABASE_URL, { schema })
