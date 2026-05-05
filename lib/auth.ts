import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { v7 as uuidv7 } from "uuid"
import { db } from "@/db"
// biome-ignore lint/performance/noNamespaceImport: false positive from Biome
import * as authSchema from "@/db/schema/auth"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
    usePlural: true,
  }),
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
  },
})
