import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json()
      console.log("[webhook:video-created] body:", body)
    } else {
      const body = await request.text()
      console.log("[webhook:video-created] body:", body)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[webhook:video-created] failed to read body:", error)

    return NextResponse.json(
      { error: "Invalid request body", ok: false },
      { status: 400 }
    )
  }
}
