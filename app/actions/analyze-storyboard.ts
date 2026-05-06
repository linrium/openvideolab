"use server"

import { generateText, Output } from "ai"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { v7 as uuidv7 } from "uuid"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { stories, storyPages, storyPanels } from "@/db/schema/stories"
import { auth } from "@/lib/auth"
import { getDeepSeekClientByUserId } from "@/lib/deepseek-client"
import {
  type StoryboardAnalysis,
  storyboardAnalysisSchema,
  storyboardSchema,
} from "@/lib/storyboard"

export interface AnalyzeStoryboardSuccess {
  analysis: StoryboardAnalysis
  generationId: string
  ok: true
  storyId: string
}

export interface AnalyzeStoryboardError {
  message: string
  ok: false
}

const STORYBOARD_TITLE_MAX_LENGTH = 80

function getStoryboardTitle(
  analysis: StoryboardAnalysis,
  prompt: string
): string {
  const candidate = analysis.storySummary.trim() || prompt.trim()

  return candidate.length > STORYBOARD_TITLE_MAX_LENGTH
    ? `${candidate.slice(0, STORYBOARD_TITLE_MAX_LENGTH).trimEnd()}…`
    : candidate
}

const STORYBOARD_SYSTEM_PROMPT = `
Bạn là biên tập viên storyboard chuyên chuẩn bị prompt tạo ảnh truyện tranh/manga.

Nhiệm vụ:
- Đọc storyboard prompt của người dùng, thường được viết bằng tiếng Việt.
- Phân tích nội dung và trích xuất thông tin hữu ích để dàn trang truyện tranh/manga.
- Chia câu chuyện thành nhiều trang hợp lý.
- Mỗi trang phải có đúng 1 prompt ảnh bằng tiếng Việt.
- Mỗi trang phải có từ 4 đến 6 panel.
- Mỗi trang phải có mảng panels gồm đúng 4 đến 6 panel chi tiết.
- Prompt của từng trang sẽ được dùng trực tiếp cho GPT Image 2, vì vậy prompt phải giàu hình ảnh, mô tả rõ bố cục nhiều panel, nhân vật, bối cảnh, hành động, cảm xúc, góc máy và phong cách manga/comic.
- Tất cả các trường văn bản trong kết quả phải viết bằng tiếng Việt.
- Giữ tính liên tục giữa các trang và giữa các panel trong cùng một trang.
- Không nhắc đến chuyện "hãy tạo ảnh", "dùng model", hay giải thích thêm ngoài dữ liệu có cấu trúc.

Yêu cầu chất lượng:
- pageSummary ngắn gọn nhưng cụ thể.
- keyEvents là các ý hành động quan trọng của trang.
- characters chỉ gồm các nhân vật xuất hiện trên trang đó.
- Mỗi panel phải có panelNumber tuần tự, summary, action, shotType, characters, và chỉ thêm dialogue/narration khi hợp lý.
- imagePrompt phải là một prompt hoàn chỉnh cho duy nhất trang đó, mô tả rõ truyện tranh/manga nhiều panel và số panel tương ứng.
- Nếu prompt gốc thiếu chi tiết, hãy tự điền các chi tiết hợp lý nhưng không làm lệch ý chính.
`.trim()

export async function analyzeStoryboardAction(
  input: unknown
): Promise<AnalyzeStoryboardSuccess | AnalyzeStoryboardError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const parsedInput = storyboardSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      ok: false,
      message: parsedInput.error.issues
        .map((issue) => issue.message)
        .join(", "),
    }
  }

  try {
    const deepseek = await getDeepSeekClientByUserId(session.user.id)

    const result = await generateText({
      model: deepseek("deepseek-chat"),
      output: Output.object({
        schema: storyboardAnalysisSchema,
        name: "storyboard_analysis",
        description:
          "Cấu trúc storyboard truyện tranh/manga theo từng trang, toàn bộ nội dung bằng tiếng Việt.",
      }),
      system: STORYBOARD_SYSTEM_PROMPT,
      prompt: parsedInput.data.prompt.trim(),
      temperature: 0.7,
    })

    const generationId = uuidv7()
    const storyId = uuidv7()
    const prompt = parsedInput.data.prompt.trim()
    const sourceUrl = parsedInput.data.sourceUrl.trim() || null
    const derivedTitle = getStoryboardTitle(result.output, prompt)

    const pageRows = result.output.pages.map((page) => ({
      cameraLanguage: page.cameraLanguage,
      characters: page.characters,
      id: uuidv7(),
      imagePrompt: page.imagePrompt,
      keyEvents: page.keyEvents,
      mood: page.mood,
      pageNumber: page.pageNumber,
      pageSummary: page.pageSummary,
      panelCount: page.panelCount,
      setting: page.setting,
      storyId,
    }))

    const panelRows = result.output.pages.flatMap((page, pageIndex) =>
      page.panels.map((panel) => ({
        action: panel.action,
        characters: panel.characters,
        dialogue: panel.dialogue || null,
        id: uuidv7(),
        narration: panel.narration || null,
        pageId: pageRows[pageIndex]?.id ?? "",
        panelNumber: panel.panelNumber,
        shotType: panel.shotType,
        summary: panel.summary,
      }))
    )

    await db.batch([
      db.insert(generations).values({
        count: result.output.pages.length,
        id: generationId,
        status: "completed",
        title: derivedTitle,
        type: "storyboard",
        userId: session.user.id,
      }),
      db.insert(stories).values({
        characters: result.output.characters,
        generationId,
        id: storyId,
        pageCount: result.output.pages.length,
        sourcePrompt: prompt,
        sourceUrl,
        storySummary: result.output.storySummary,
        styleNotes: result.output.styleNotes,
        title: derivedTitle,
        visualDirection: result.output.visualDirection,
      }),
      db.insert(storyPages).values(pageRows),
      db.insert(storyPanels).values(panelRows),
    ])

    revalidatePath("/", "layout")
    revalidatePath("/storyboard/new")

    return {
      analysis: result.output,
      generationId,
      ok: true,
      storyId,
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to analyze storyboard",
    }
  }
}
