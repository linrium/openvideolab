"use client"

import {
  AiChemistry02Icon,
  Logout01Icon,
  Moon02Icon,
  Settings01Icon,
  Sun01Icon,
  VideoIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const mainNavigation = [
  { href: "/videos", icon: VideoIcon, label: "New Video" },
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
  id: string
  jobId: string
  prompt: string
  status: string
  title: string
}

interface AppSidebarProps {
  videos: VideoItem[]
}

export function AppSidebar({ videos }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const { state, toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        {state === "collapsed" ? (
          <button
            className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={toggleSidebar}
            type="button"
          >
            <HugeiconsIcon icon={AiChemistry02Icon} size={18} strokeWidth={2} />
          </button>
        ) : (
          <Link
            className="flex items-center gap-2 overflow-hidden rounded-md"
            href="/videos"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeiconsIcon
                icon={AiChemistry02Icon}
                size={14}
                strokeWidth={2}
              />
            </div>
            <span className="truncate font-semibold text-sm">OpenVideoLab</span>
          </Link>
        )}
        <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:hidden" />
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

        {videos.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>VIDEOS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {videos.map((video) => (
                  <SidebarMenuItem key={video.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto py-2 text-sidebar-foreground/85 group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-0!"
                      isActive={pathname === `/videos/${video.id}`}
                      size="sm"
                      tooltip={video.title || video.prompt}
                    >
                      <Link href={`/videos/${video.id}`}>
                        <span
                          className={`size-2 shrink-0 rounded-full ${STATUS_DOT[video.status] ?? "bg-zinc-400"}`}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {(video.title || video.prompt).length > 40
                            ? `${(video.title || video.prompt).slice(0, 40)}…`
                            : video.title || video.prompt}
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
              <HugeiconsIcon
                className="hidden dark:block"
                icon={Sun01Icon}
                size={18}
                strokeWidth={2}
              />
              <HugeiconsIcon
                className="dark:hidden"
                icon={Moon02Icon}
                size={18}
                strokeWidth={2}
              />
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
              <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={2} />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
