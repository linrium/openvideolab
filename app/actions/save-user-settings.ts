"use server"

import { headers } from "next/headers"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"
import { auth } from "@/lib/auth"

export interface SaveUserSettingsInput {
  cloudflareR2AccessKeyId: string
  cloudflareR2EndpointUrl: string
  cloudflareR2SecretAccessKey: string
  deepSeekApiKey: string
  kieApiKey: string
  openAiApiKey: string
  openRouterApiKey: string
}

export interface SaveUserSettingsResult {
  ok: true
}

export interface SaveUserSettingsError {
  message: string
  ok: false
}

const normalizeValue = (value: string): string | null => {
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

export async function saveUserSettingsAction(
  input: SaveUserSettingsInput
): Promise<SaveUserSettingsResult | SaveUserSettingsError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  try {
    await db
      .insert(userSettings)
      .values({
        userId: session.user.id,
        cloudflareAccessKeyId: normalizeValue(input.cloudflareR2AccessKeyId),
        cloudflareR2EndpointUrl: normalizeValue(input.cloudflareR2EndpointUrl),
        cloudflareSecretAccessKey: normalizeValue(
          input.cloudflareR2SecretAccessKey
        ),
        deepseekApiKey: normalizeValue(input.deepSeekApiKey),
        kieApiKey: normalizeValue(input.kieApiKey),
        openaiApiKey: normalizeValue(input.openAiApiKey),
        openrouterApiKey: normalizeValue(input.openRouterApiKey),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          cloudflareAccessKeyId: normalizeValue(input.cloudflareR2AccessKeyId),
          cloudflareR2EndpointUrl: normalizeValue(
            input.cloudflareR2EndpointUrl
          ),
          cloudflareSecretAccessKey: normalizeValue(
            input.cloudflareR2SecretAccessKey
          ),
          deepseekApiKey: normalizeValue(input.deepSeekApiKey),
          kieApiKey: normalizeValue(input.kieApiKey),
          openaiApiKey: normalizeValue(input.openAiApiKey),
          openrouterApiKey: normalizeValue(input.openRouterApiKey),
          updatedAt: new Date(),
        },
      })

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to save settings",
    }
  }
}
