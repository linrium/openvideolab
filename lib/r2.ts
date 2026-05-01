import {
  GetObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

interface PresignedUrlOptions {
  expiresIn?: number
  key: string
  operation?: "get" | "put"
}

const client = new S3Client()
const bucket = "openvideolab"

export async function uploadToR2(
  key: string,
  body: PutObjectCommandInput["Body"],
  contentType?: string
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: "openvideolab",
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function downloadFromR2(key: string): Promise<Uint8Array> {
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  )

  if (!response.Body) {
    throw new Error(`No body returned for key: ${key}`)
  }

  return response.Body.transformToByteArray()
}

export async function getPresignedUrl(
  options: PresignedUrlOptions
): Promise<string> {
  const { key, operation = "get", expiresIn = 3600 } = options

  const command =
    operation === "put"
      ? new PutObjectCommand({ Bucket: bucket, Key: key })
      : new GetObjectCommand({ Bucket: bucket, Key: key })

  return await getSignedUrl(client, command, { expiresIn })
}

// Streams a remote URL directly into R2 without buffering the full file in memory.
export async function streamUrlToR2(
  url: string,
  key: string,
  contentType?: string
): Promise<void> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    )
  }

  if (!response.body) {
    throw new Error("Response body is null")
  }

  const resolvedContentType =
    contentType ??
    response.headers.get("content-type") ??
    "application/octet-stream"

  await uploadToR2(
    key,
    response.body as unknown as PutObjectCommandInput["Body"],
    resolvedContentType
  )
}

interface StreamVideoToR2Options {
  apiKey: string
  index?: number
  jobId: string
  key: string
}

// Streams a generated video from OpenRouter directly into R2 by job ID and optional content index.
export async function streamOpenRouterVideoToR2(
  options: StreamVideoToR2Options
): Promise<void> {
  const { apiKey, jobId, index = 0, key } = options
  const url = new URL(`https://openrouter.ai/api/v1/videos/${jobId}/content`)
  url.searchParams.set("index", String(index))

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.error?.message ?? response.statusText
    throw new Error(`OpenRouter video content fetch failed: ${message}`)
  }

  if (!response.body) {
    throw new Error("Response body is null")
  }

  await uploadToR2(
    key,
    response.body as unknown as PutObjectCommandInput["Body"],
    "video/mp4"
  )
}
