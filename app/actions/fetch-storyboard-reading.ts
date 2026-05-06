"use server"

import { load } from "cheerio"
import { headers } from "next/headers"
import z from "zod/v4"
import { auth } from "@/lib/auth"

const fetchStoryboardReadingSchema = z.object({
  url: z.string().trim().url("Enter a valid URL."),
})

export interface FetchStoryboardReadingSuccess {
  content: string
  ok: true
}

export interface FetchStoryboardReadingError {
  message: string
  ok: false
}

export async function fetchStoryboardReadingAction(
  input: unknown
): Promise<FetchStoryboardReadingSuccess | FetchStoryboardReadingError> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, message: "Unauthorized" }
  }

  const parsedInput = fetchStoryboardReadingSchema.safeParse(input)
  if (!parsedInput.success) {
    return {
      ok: false,
      message: parsedInput.error.issues
        .map((issue) => issue.message)
        .join(", "),
    }
  }

  try {
    const response = await fetch(parsedInput.data.url)
    if (!response.ok) {
      return {
        ok: false,
        message: `Failed to fetch page: ${response.status} ${response.statusText}`,
      }
    }

    const html = await response.text()
    const $ = load(html)
    const content = $(".reading").first().text().trim()

    if (!content) {
      return {
        ok: false,
        message: "Could not find any content in the .reading section.",
      }
    }

    return { content, ok: true }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch content",
    }
  }
}
