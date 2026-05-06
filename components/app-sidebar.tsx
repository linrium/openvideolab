"use client"

import {
  AiChemistry02Icon,
  ClipboardIcon,
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
  { href: "/images/new", icon: Image01Icon, label: "New Image" },
  { href: "/storyboard/new", icon: ClipboardIcon, label: "New Storyboard" },
] as const

const RECENT_ICON = {
  image: Image01Icon,
  music: MusicNote03FreeIcons,
  storyboard: ClipboardIcon,
  video: VideoIcon,
} as const

const STATUS_BAR_CLASS: Record<string, string> = {
  cancelled: "bg-zinc-400",
  completed: "bg-emerald-400",
  expired: "bg-zinc-400",
  failed: "bg-red-400",
  in_progress: "bg-sky-400",
  pending: "bg-amber-400",
}

interface RecentItem {
  id: string
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

  if (item.type === "image") {
    return `/images/${item.id}`
  }

  if (item.type === "music") {
    return "/music/new"
  }

  if (item.type === "storyboard") {
    return "/storyboard/new"
  }

  return "/images/new"
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
                  const title = item.title

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
                          <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full ${STATUS_BAR_CLASS[item.status] ?? "bg-zinc-400"} group-data-[collapsible=icon]:hidden`}
                          />
                          <HugeiconsIcon
                            className="shrink-0 group-data-[collapsible=icon]:hidden"
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
