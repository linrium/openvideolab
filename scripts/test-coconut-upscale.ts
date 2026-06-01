import "dotenv/config"
/**
 * Test script to submit a Coconut.co upscale job using Cloudflare R2 storage.
 *
 * Required env vars:
 *   COCONUT_API_KEY         - Coconut.co API key
 *   AWS_ENDPOINT_URL        - R2 endpoint (e.g. https://<account>.r2.cloudflarestorage.com)
 *   AWS_ACCESS_KEY_ID       - R2 access key
 *   AWS_SECRET_ACCESS_KEY   - R2 secret key
 *   R2_BUCKET               - R2 bucket name
 *
 * Optional:
 *   INPUT_VIDEO_URL         - Public URL of the video to upscale (defaults to a sample)
 */

const COCONUT_API_URL = "https://api.coconut.co/v2/jobs"

const apiKey = process.env.COCONUT_API_KEY
const r2Endpoint = process.env.AWS_ENDPOINT_URL
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const bucket = process.env.R2_BUCKET
const inputUrl =
  process.env.INPUT_VIDEO_URL ??
  "https://openvideolab.2541b6be9f2bb7c70cfdec27c3dbedcd.r2.cloudflarestorage.com/019de81d-ed4a-7578-8b57-412e42146987/videos/e60895afc97742e8a7c5d237468be9fb.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=f2d9f31b86ef48be3f296f2f324c169a%2F20260531%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260531T141645Z&X-Amz-Expires=3600&X-Amz-Signature=1d1a3f334b10622b75583fe1d8b524e6050dc4a4171e1213ea22959b46d924f6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"

const missing = [
  !apiKey && "COCONUT_API_KEY",
  !r2Endpoint && "AWS_ENDPOINT_URL",
  !accessKeyId && "AWS_ACCESS_KEY_ID",
  !secretAccessKey && "AWS_SECRET_ACCESS_KEY",
  !bucket && "R2_BUCKET",
].filter(Boolean)

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`)
  process.exit(1)
}

const job = {
  input: {
    url: inputUrl,
  },
  storage: {
    service: "coconut",
  },
  notification: {
    type: "http",
    url: process.env.COCONUT_WEBHOOK_URL ?? "https://httpbin.org/post",
  },
  outputs: {
    // Upscale to 4K — adjust format/resolution as needed
    "mp4:2160p": {
      path: "/upscaled/video_4k.mp4",
    },
  },
}

async function main() {
  console.log("Submitting Coconut job…")
  console.log("Input:", inputUrl)
  console.log("Storage bucket:", bucket)
  console.log("Output: mp4:2160p → /upscaled/video_4k.mp4\n")

  const response = await fetch(COCONUT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Basic auth: base64("apiKey:")
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(job),
  })

  const text = await response.text()

  if (!response.ok) {
    console.error(
      "Job submission failed:",
      response.status,
      response.statusText
    )
    console.error(text)
    process.exit(1)
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    console.error("Unexpected non-JSON response:", text)
    process.exit(1)
  }

  console.log("Job created successfully!")
  console.log(JSON.stringify(data, null, 2))
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
