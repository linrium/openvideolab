"use server"

import { generateText, Output } from "ai"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { v7 as uuidv7 } from "uuid"
import { db } from "@/db"
import { generations } from "@/db/schema/generations"
import { stories, storyPages } from "@/db/schema/stories"
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

function getStoryboardTitle(inputTitle: string, prompt: string): string {
  const candidate = inputTitle.trim() || prompt.trim()

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
- Mỗi trang phải có trường originalContent bằng tiếng Việt để giữ lại nội dung gốc/tóm lược lời thoại-tự sự của riêng trang đó, dùng cho bước tạo audio sau này.
- Mỗi trang phải có đúng 1 prompt ảnh bằng tiếng Việt.
- Mỗi trang phải có đúng số panel mà người dùng yêu cầu.
- Prompt của từng trang sẽ được dùng trực tiếp cho GPT Image 2, vì vậy prompt phải rất giàu hình ảnh và mô tả kỹ:
  nhân vật chính và phụ, cảm xúc nhân vật, bối cảnh nền, đạo cụ, ánh sáng, góc nhìn máy quay, cỡ cảnh, bố cục từng panel, hành động, nhịp truyện, lời thoại quan trọng xuất hiện trong khung thoại hoặc caption, và phong cách manga/comic.
- Tất cả các trường văn bản trong kết quả phải viết bằng tiếng Việt.
- Giữ tính liên tục giữa các trang.
- Không nhắc đến chuyện "hãy tạo ảnh", "dùng model", hay giải thích thêm ngoài dữ liệu có cấu trúc.

Yêu cầu chất lượng:
- characters chỉ gồm các nhân vật xuất hiện trên trang đó.
- originalContent phải giữ được nội dung gốc quan trọng của trang để có thể dùng làm nền cho audio/lời đọc.
- imagePrompt phải là một prompt hoàn chỉnh cho duy nhất trang đó, mô tả rõ truyện tranh/manga nhiều panel và số panel tương ứng, nhấn mạnh biểu cảm nhân vật, hậu cảnh, góc nhìn máy quay, lời thoại/caption, và sự nhất quán hình ảnh giữa các panel.
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
      prompt: [
        `Số panel mỗi trang bắt buộc: ${parsedInput.data.panelCount}.`,
        parsedInput.data.prompt.trim(),
      ]
        .filter(Boolean)
        .join("\n\n"),
      temperature: 0.7,
    })

    const generationId = uuidv7()
    const storyId = uuidv7()
    const prompt = parsedInput.data.prompt.trim()
    const sourceUrl = parsedInput.data.sourceUrl.trim() || null
    const derivedTitle = getStoryboardTitle(parsedInput.data.title, prompt)
    const normalizedAnalysis: StoryboardAnalysis = {
      ...result.output,
      pages: result.output.pages.map((page) => ({
        ...page,
        panelCount: parsedInput.data.panelCount,
      })),
    }

    const pageRows = normalizedAnalysis.pages.map((page) => ({
      characters: page.characters,
      id: uuidv7(),
      imagePrompt: page.imagePrompt,
      originalContent: page.originalContent,
      pageNumber: page.pageNumber,
      panelCount: page.panelCount,
      storyId,
      userId: session.user.id,
    }))

    await db.batch([
      db.insert(generations).values({
        count: normalizedAnalysis.pages.length,
        id: generationId,
        status: "completed",
        title: derivedTitle,
        type: "storyboard",
        userId: session.user.id,
      }),
      db.insert(stories).values({
        characters: normalizedAnalysis.characters,
        generationId,
        id: storyId,
        pageCount: normalizedAnalysis.pages.length,
        sourcePrompt: prompt,
        sourceUrl,
        styleNotes: normalizedAnalysis.styleNotes,
        title: derivedTitle,
        userId: session.user.id,
      }),
      db.insert(storyPages).values(pageRows),
    ])

    revalidatePath("/", "layout")
    revalidatePath("/storyboard/new")

    return {
      analysis: normalizedAnalysis,
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
