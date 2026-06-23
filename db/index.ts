import { getCloudflareContext } from "@opennextjs/cloudflare"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { cache } from "react"
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

interface BatchQuery<TResult = unknown> {
  readonly _: {
    readonly result: TResult
  }
}

type BatchResponse<TQueries extends readonly BatchQuery[]> = {
  [Key in keyof TQueries]: TQueries[Key]["_"]["result"]
}

type Database = NodePgDatabase<typeof schema> & {
  batch: <const TQueries extends readonly [BatchQuery, ...BatchQuery[]]>(
    queries: TQueries
  ) => Promise<BatchResponse<TQueries>>
}

const createDb = (connectionString: string): Database => {
  const pool = new Pool({
    connectionString,
    maxUses: 1,
  })

  const database = drizzle({ client: pool, schema })

  return Object.assign(database, {
    async batch<const TQueries extends readonly [BatchQuery, ...BatchQuery[]]>(
      queries: TQueries
    ): Promise<BatchResponse<TQueries>> {
      const results: unknown[] = []

      for (const query of queries) {
        results.push(await (query as unknown as PromiseLike<unknown>))
      }

      return results as BatchResponse<TQueries>
    },
  })
}

export const getDb = cache(() => {
  const { env } = getCloudflareContext()

  return createDb(env.HYPERDRIVE.connectionString)
})

export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true })

  return createDb(env.HYPERDRIVE.connectionString)
})

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const database = getDb()
    const value = Reflect.get(database, property, receiver)

    if (typeof value === "function") {
      return value.bind(database)
    }

    return value
  },
})
