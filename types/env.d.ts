// biome-ignore lint/style/noNamespace: false positive
declare namespace NodeJS {
  interface ProcessEnv {
    AWS_ACCESS_KEY_ID: string
    AWS_ENDPOINT_URL: string

    AWS_REGION: string
    AWS_SECRET_ACCESS_KEY: string
    BETTER_AUTH_URL: string
    DATABASE_URL: string

    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string

    NEXT_PUBLIC_BASE_URL: string

    OPENROUTER_API_KEY: string
    OPENROUTER_BASE_URL: string
  }
}
