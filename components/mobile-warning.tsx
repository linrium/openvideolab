"use client"

import { IconDeviceDesktop } from "@tabler/icons-react"

export function MobileWarning() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-8 text-center md:hidden">
      <IconDeviceDesktop className="h-12 w-12 text-muted-foreground" />
      <h1 className="font-semibold text-xl">Desktop Only</h1>
      <p className="max-w-xs text-muted-foreground text-sm">
        OpenVideoLab doesn&apos;t support mobile screens yet. Please open it on
        a desktop or laptop for the best experience.
      </p>
    </div>
  )
}
