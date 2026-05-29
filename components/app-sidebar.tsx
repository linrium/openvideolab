"use client"

import {
  type Icon,
  IconClipboard,
  IconFlask,
  IconLogout,
  IconMoon,
  IconMusic,
  IconPhoto,
  IconSettings,
  IconSun,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useState } from "react"
import { toast } from "sonner"
import { deleteGenerationAction } from "@/app/actions/delete-generation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const mainNavigation: { href: string; icon: Icon; label: string }[] = [
  { href: "/videos/new", icon: IconVideo, label: "New Video" },
  { href: "/images/new", icon: IconPhoto, label: "New Image" },
  // { href: "/storyboard/new", icon: IconClipboard, label: "New Storyboard" },
]

const RECENT_ICON: Record<string, Icon> = {
  image: IconPhoto,
  music: IconMusic,
  storyboard: IconClipboard,
  video: IconVideo,
}

const STATUS_BAR_CLASS: Record<string, string> = {
  cancelled: "bg-zinc-400",
  completed: "bg-emerald-400",
  expired: "bg-zinc-400",
  failed: "bg-red-400",
  in_progress: "bg-sky-400",
  pending: "bg-amber-400",
}

const NEW_PAGE_BY_TYPE: Record<string, string> = {
  image: "/images/new",
  music: "/music/new",
  storyboard: "/storyboard/new",
  video: "/videos/new",
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
    return `/storyboard/${item.id}`
  }

  return "/images/new"
}

export function AppSidebar({ recents }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const { state, toggleSidebar } = useSidebar()
  const [pendingDelete, setPendingDelete] = useState<RecentItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteGenerationAction(pendingDelete.id)
      if (!result.ok) {
        toast.error("Failed to delete", { description: result.message })
        return
      }

      const deletedHref = getRecentHref(pendingDelete)
      if (pathname === deletedHref) {
        router.push(NEW_PAGE_BY_TYPE[pendingDelete.type] ?? "/images/new")
      }
      router.refresh()
    } finally {
      setIsDeleting(false)
      setPendingDelete(null)
    }
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
            <IconFlask size={14} />
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
                      <item.icon size={16} />
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
                  const ItemIcon = RECENT_ICON[item.type] ?? IconPhoto
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
                          <ItemIcon
                            className="shrink-0 group-data-[collapsible=icon]:hidden"
                            size={14}
                          />
                          <span className="truncate text-sm group-data-[collapsible=icon]:hidden">
                            {title.length > 40
                              ? `${title.slice(0, 40)}…`
                              : title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        aria-label={`Delete ${title}`}
                        className="top-1/2! -translate-y-1/2! text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDelete(item)}
                        showOnHover
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </SidebarMenuAction>
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
                <IconSettings size={16} />
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

      <Dialog
        onOpenChange={(open) => {
          if (!(isDeleting || open)) {
            setPendingDelete(null)
          }
        }}
        open={pendingDelete !== null}
      >
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete generation?</DialogTitle>
          <DialogDescription>
            This will permanently delete all files in this session and cannot be
            undone.
          </DialogDescription>
          <DialogFooter>
            <Button
              disabled={isDeleting}
              onClick={() => setPendingDelete(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              type="button"
              variant="destructive"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
