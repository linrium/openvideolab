import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { images } from "@/db/schema/images"
import { auth } from "@/lib/auth"
import { downloadFromR2 } from "@/lib/r2"

const FILE_NAME_PATTERN = /[^a-zA-Z0-9._-]/g
const LEADING_SLASH_PATTERN = /^\/+/

function getR2KeyFromUrl(value: string | null): string | null {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)
    const key = decodeURIComponent(
      url.pathname.replace(LEADING_SLASH_PATTERN, "")
    )
    return key || null
  } catch {
    return null
  }
}

function getDownloadFileName(key: string): string {
  const fileName = key.split("/").pop() || "image.webp"
  return fileName.replace(FILE_NAME_PATTERN, "_")
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = getR2KeyFromUrl(request.nextUrl.searchParams.get("url"))
  if (!key) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
  }

  const [image] = await db
    .select({
      mimeType: images.mimeType,
      path: images.path,
    })
    .from(images)
    .innerJoin(generations, eq(generations.id, images.generationId))
    .where(
      and(
        eq(images.path, key),
        eq(images.userId, session.user.id),
        eq(generations.userId, session.user.id)
      )
    )
    .limit(1)

  if (!image?.path) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  const body = await downloadFromR2(image.path)

  return new NextResponse(Buffer.from(body), {
    headers: {
      "Content-Disposition": `attachment; filename="${getDownloadFileName(
        image.path
      )}"`,
      "Content-Type": image.mimeType ?? "application/octet-stream",
    },
  })
}
