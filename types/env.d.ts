// biome-ignore lint/style/noNamespace: false positive
declare namespace NodeJS {
  interface ProcessEnv {
    AWS_ACCESS_KEY_ID: string
    AWS_ENDPOINT_URL: string

    AWS_REGION: string
    AWS_SECRET_ACCESS_KEY: string
    BETTER_AUTH_URL: string

    CLOUDFLARE_ACCOUNT_ID: string
    CLOUDFLARE_D1_API_TOKEN: string
    CLOUDFLARE_D1_DATABASE_ID: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string

    KIE_BASE_URL: string

    NEXT_PUBLIC_BASE_URL: string

    OPENROUTER_API_KEY: string
    OPENROUTER_BASE_URL: string
    OPENROUTER_BASE_WEBHOOK_URL: string
  }
}

interface CloudflareEnv {
  DB: D1Database
}

declare module "cloudflare:workers" {
  export const env: CloudflareEnv
}
