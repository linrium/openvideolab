import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", ok: false },
      { status: 400 }
    )
  }

  console.log("[webhook:coconut]", JSON.stringify(body, null, 2))

  return NextResponse.json({ ok: true })
}
