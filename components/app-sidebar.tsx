"use client"

import { AiVideoIcon, Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const mainNavigation = [
  { href: "/", icon: AiVideoIcon, label: "Videos" },
  { href: "/settings", icon: Settings01Icon, label: "Settings" },
] as const

const historyGroups = [
  {
    items: [
      { status: "completed", title: "Rainy alley chase" },
      { status: "queued", title: "Studio product teaser" },
      { status: "rendering", title: "Golden-hour lake pan" },
    ],
    label: "Today",
  },
  {
    items: [
      { status: "draft", title: "Fantasy castle reveal" },
      { status: "failed", title: "City fly-through" },
      { status: "completed", title: "Quiet portrait close-up" },
    ],
    label: "Yesterday",
  },
  {
    items: [
      { status: "completed", title: "Night market opener" },
      { status: "draft", title: "Slow-motion dance cut" },
    ],
    label: "Previous 7 days",
  },
] as const

const historyStatusDotClassName = {
  completed: "bg-emerald-500",
  draft: "bg-zinc-400",
  failed: "bg-rose-500",
  queued: "bg-amber-500",
  rendering: "bg-sky-500",
} as const

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="New video" variant="outline">
              <Link href="/">
                <HugeiconsIcon icon={AiVideoIcon} strokeWidth={2} />
                <span>New video</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {historyGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className="h-auto py-2 text-sidebar-foreground/85"
                      size="sm"
                      tooltip={item.title}
                      type="button"
                    >
                      <span
                        className={`size-2 rounded-full ${historyStatusDotClassName[item.status]}`}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
