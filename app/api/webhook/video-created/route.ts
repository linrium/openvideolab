import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import z from "zod/v4"
import { pollJobStatusAction } from "@/app/actions/poll-job-status-action"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { videos } from "@/db/schema/videos"

const webhookBodySchema = z.object({
  data: z.object({
    generation_id: z.string(),
    id: z.string(),
    model: z.string(),
    status: z.enum([
      "pending",
      "in_progress",
      "completed",
      "failed",
      "cancelled",
      "expired",
    ]),
    unsigned_urls: z.array(z.string()),
    usage: z.object({
      cost: z.number(),
      is_byok: z.boolean(),
    }),
  }),
})

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json()
      const result = webhookBodySchema.safeParse(body)
      if (!result.success) {
        console.error(
          "[webhook:video-created] invalid body:",
          result.error.flatten()
        )

        return NextResponse.json(
          { error: "Invalid webhook body", ok: false },
          { status: 400 }
        )
      }

      console.log("[webhook:video-created] body:", result.data)

      const jobId = result.data.data.id
      const [video] = await db
        .select({ userId: generations.userId })
        .from(videos)
        .innerJoin(generations, eq(videos.generationRecordId, generations.id))
        .where(eq(videos.jobId, jobId))
        .limit(1)

      if (video) {
        const syncResult = await pollJobStatusAction(jobId, {
          refreshClient: false,
          userId: video.userId,
        })
        console.log("[webhook:video-created] sync result:", syncResult)
      }
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
