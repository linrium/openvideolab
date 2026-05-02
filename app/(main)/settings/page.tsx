import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SettingsForm, type SettingsValues } from "@/components/settings-form"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Settings | OpenVideoLab",
  description: "Manage saved API credentials for OpenVideoLab.",
}

const EMPTY_SETTINGS_VALUES: SettingsValues = {
  cloudflareR2AccessKeyId: "",
  cloudflareR2EndpointUrl: "",
  cloudflareR2SecretAccessKey: "",
  openAiApiKey: "",
  openRouterApiKey: "",
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return redirect("/sign-in")
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1)

  return (
    <div className="flex w-full flex-col px-4 py-4 sm:px-6 sm:py-6">
      <SettingsForm
        initialValues={
          settings
            ? {
                cloudflareR2AccessKeyId: settings.cloudflareAccessKeyId ?? "",
                cloudflareR2EndpointUrl: settings.cloudflareR2EndpointUrl ?? "",
                cloudflareR2SecretAccessKey:
                  settings.cloudflareSecretAccessKey ?? "",
                openAiApiKey: settings.openaiApiKey ?? "",
                openRouterApiKey: settings.openrouterApiKey ?? "",
              }
            : EMPTY_SETTINGS_VALUES
        }
      />
    </div>
  )
}
