import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { v7 as uuidv7 } from "uuid"
import { auth } from "@/lib/auth"
import { getPresignedUrl, uploadToR2 } from "@/lib/r2"

const MAX_SIZE = 15 * 1024 * 1024
const UPLOAD_CONFIG = {
  "audio/mpeg": {
    category: "audio",
  },
  "audio/wav": {
    category: "audio",
  },
  "audio/wave": {
    category: "audio",
  },
  "audio/x-wav": {
    category: "audio",
  },
  "image/gif": {
    category: "images",
  },
  "image/jpeg": {
    category: "images",
  },
  "image/png": {
    category: "images",
  },
  "image/webp": {
    category: "images",
  },
} as const

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const uploadConfig = UPLOAD_CONFIG[file.type as keyof typeof UPLOAD_CONFIG]

  if (!uploadConfig) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF, MP3, and WAV files are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds the 15 MB limit" },
      { status: 400 }
    )
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase() ??
    (uploadConfig.category === "audio" ? "mp3" : "jpg")
  const key = `${session.user.id}/${uploadConfig.category}/${uuidv7()}.${ext}`

  const buffer = await file.arrayBuffer()
  await uploadToR2(key, Buffer.from(buffer), file.type)

  const url = await getPresignedUrl({
    key,
    operation: "get",
    expiresIn: 3600,
  })

  return NextResponse.json({ url, key })
}
