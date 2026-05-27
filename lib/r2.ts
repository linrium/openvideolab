import {
  DeleteObjectsCommand,
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

export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  )
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
