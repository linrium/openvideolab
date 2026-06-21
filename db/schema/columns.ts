import { sql } from "drizzle-orm"
import { integer } from "drizzle-orm/sqlite-core"

export const currentTimestampMs = sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`

export const timestampMs = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
