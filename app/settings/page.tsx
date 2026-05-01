import type { Metadata } from "next"
import { SettingsForm } from "@/components/settings-form"

export const metadata: Metadata = {
  title: "Settings | OpenVideoLab",
  description: "Manage local API credentials for OpenVideoLab.",
}

export default function SettingsPage() {
  return (
    <div className="flex w-full flex-col px-4 py-4 sm:px-6 sm:py-6">
      <SettingsForm />
    </div>
  )
}
