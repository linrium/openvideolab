import { createDeepSeek } from "@ai-sdk/deepseek"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"

export function createDeepSeekClient(apiKey: string) {
  return createDeepSeek({ apiKey })
}

export async function getDeepSeekApiKeyByUserId(
  userId: string
): Promise<string> {
  const [settings] = await db
    .select({ deepseekApiKey: userSettings.deepseekApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (!settings?.deepseekApiKey) {
    throw new Error("DeepSeek API key is not configured for this user")
  }

  return settings.deepseekApiKey
}

export async function getDeepSeekClientByUserId(userId: string) {
  const apiKey = await getDeepSeekApiKeyByUserId(userId)
  return createDeepSeekClient(apiKey)
}
