import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { videos } from "@/db/schema/videos"
import { auth } from "@/lib/auth"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const pathname = requestHeaders.get("x-pathname") ?? ""
  const isExploreRoute = pathname.startsWith("/explore")

  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!(session || isExploreRoute)) {
    return redirect("/sign-in")
  }

  const recents =
    session == null
      ? []
      : await db
          .select({
            id: generations.id,
            title: generations.title,
            status: generations.status,
            type: generations.type,
            videoId: videos.id,
          })
          .from(generations)
          .leftJoin(videos, eq(videos.generationId, generations.id))
          .where(eq(generations.userId, session.user.id))
          .orderBy(desc(generations.createdAt))
          .limit(20)

  return (
    <SidebarProvider>
      <AppSidebar isAuthenticated={session != null} recents={recents} />
      <SidebarInset>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
