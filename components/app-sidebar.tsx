"use client"

import { AiVideoIcon, Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { IconLogout, IconMoon, IconSun } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const mainNavigation = [
  { href: "/videos", icon: AiVideoIcon, label: "Videos" },
] as const

const STATUS_DOT: Record<string, string> = {
  cancelled: "bg-zinc-400",
  completed: "bg-emerald-500",
  expired: "bg-zinc-400",
  failed: "bg-rose-500",
  in_progress: "bg-sky-500",
  pending: "bg-amber-500",
}

interface VideoItem {
  jobId: string
  prompt: string
  status: string
}

interface AppSidebarProps {
  videos: VideoItem[]
}

export function AppSidebar({ videos }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  return (
    <Sidebar collapsible="icon">
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

        {videos.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>VIDEOS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {videos.map((video) => (
                  <SidebarMenuItem key={video.jobId}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2 text-sidebar-foreground/85"
                      isActive={pathname === `/videos/${video.jobId}`}
                      size="sm"
                      tooltip={video.prompt}
                    >
                      <Link href={`/videos/${video.jobId}`}>
                        <span
                          className={`size-2 shrink-0 rounded-full ${STATUS_DOT[video.status] ?? "bg-zinc-400"}`}
                        />
                        <span className="truncate">
                          {video.prompt.length > 40
                            ? `${video.prompt.slice(0, 40)}…`
                            : video.prompt}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() =>
                setTheme(
                  document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark"
                )
              }
              tooltip="Toggle theme"
              type="button"
            >
              <IconSun className="hidden dark:block" size={18} />
              <IconMoon className="dark:hidden" size={18} />
              <span className="hidden dark:inline">Light mode</span>
              <span className="dark:hidden">Dark mode</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              tooltip="Settings"
            >
              <Link href="/settings">
                <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log out"
              type="button"
            >
              <IconLogout size={18} />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
