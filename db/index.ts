import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"

export const db = drizzle(getCloudflareContext().env.DB)
