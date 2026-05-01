import { type NextRequest, NextResponse } from "next/server"
import { v7 as uuidv7 } from "uuid"
import { getPresignedUrl, uploadToR2 } from "@/lib/r2"

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds the 10 MB limit" },
      { status: 400 }
    )
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const key = `uploads/${uuidv7()}.${ext}`

  const buffer = await file.arrayBuffer()
  await uploadToR2(key, Buffer.from(buffer), file.type)

  const url = await getPresignedUrl({
    key,
    operation: "get",
    expiresIn: 3600,
  })

  return NextResponse.json({ url, key })
}
