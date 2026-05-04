"use client"

import {
  AiChemistry02Icon,
  Image01Icon,
  Logout01Icon,
  Moon02Icon,
  MusicNote03FreeIcons,
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
  { href: "/videos/new", icon: VideoIcon, label: "New Video" },
  { href: "/assets/new", icon: Image01Icon, label: "New Asset" },
  { href: "/music/new", icon: MusicNote03FreeIcons, label: "New Music" },
] as const

const STATUS_ICON: Record<string, string> = {
  cancelled: "text-zinc-400",
  completed: "text-emerald-500",
  expired: "text-zinc-400",
  failed: "text-rose-500",
  in_progress: "text-sky-500",
  pending: "text-amber-500",
}

const RECENT_ICON = {
  image: Image01Icon,
  music: MusicNote03FreeIcons,
  storyboard: Image01Icon,
  video: VideoIcon,
} as const

interface RecentItem {
  id: string
  prompt: string
  status: string
  title: string
  type: string
  videoId: string | null
}

interface AppSidebarProps {
  recents: RecentItem[]
}

function getRecentHref(item: RecentItem): string {
  if (item.type === "video" && item.videoId) {
    return `/videos/${item.videoId}`
  }

  if (item.type === "music") {
    return "/music/new"
  }

  return "/assets/new"
}

export function AppSidebar({ recents }: AppSidebarProps) {
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
            <HugeiconsIcon icon={AiChemistry02Icon} size={14} strokeWidth={2} />
          </button>
        ) : (
          <Link
            className="flex items-center gap-2 overflow-hidden rounded-md"
            href="/videos"
          >
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

        {recents.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recents.map((item) => {
                  const href = getRecentHref(item)
                  const icon =
                    RECENT_ICON[item.type as keyof typeof RECENT_ICON] ??
                    Image01Icon
                  const title = item.title || item.prompt

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        className="h-auto py-1.5 text-sidebar-foreground/85 group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-0!"
                        isActive={pathname === href}
                        size="sm"
                        tooltip={title}
                      >
                        <Link href={href}>
                          <HugeiconsIcon
                            className={`shrink-0 group-data-[collapsible=icon]:hidden ${STATUS_ICON[item.status] ?? "text-zinc-400"}`}
                            icon={icon}
                            size={14}
                            strokeWidth={2}
                          />
                          <span className="truncate text-sm group-data-[collapsible=icon]:hidden">
                            {title.length > 40
                              ? `${title.slice(0, 40)}…`
                              : title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
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
