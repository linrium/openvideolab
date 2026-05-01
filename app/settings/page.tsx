import type { Metadata } from "next"
import { SettingsForm } from "@/components/settings-form"

export const metadata: Metadata = {
  title: "Settings | OpenVideoLab",
  description: "Manage local API credentials for OpenVideoLab.",
}

export default function SettingsPage() {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="font-heading font-medium text-2xl tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure the API credentials this app should use in your browser.
        </p>
      </div>

      <SettingsForm />
    </div>
  )
}
