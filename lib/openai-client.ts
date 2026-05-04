import { eq } from "drizzle-orm"
import OpenAI from "openai"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"

export function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey })
}

export async function getOpenAiApiKeyByUserId(userId: string): Promise<string> {
  const [settings] = await db
    .select({ openAiApiKey: userSettings.openaiApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (!settings?.openAiApiKey) {
    throw new Error("OpenAI API key is not configured for this user")
  }

  return settings.openAiApiKey
}

export async function getOpenAiClientByUserId(userId: string): Promise<OpenAI> {
  const apiKey = await getOpenAiApiKeyByUserId(userId)
  return createOpenAiClient(apiKey)
}
