import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const providerGuides = [
  {
    description:
      "Create an S3-compatible access key pair for your Cloudflare R2 bucket.",
    docsHref: "https://developers.cloudflare.com/r2/api/s3/tokens/",
    keyPageHref: "https://dash.cloudflare.com/?to=/:account/r2/api-tokens",
    name: "Cloudflare R2",
    steps: [
      "Open the Cloudflare dashboard and select the account that owns your R2 bucket.",
      "Go to R2 and open the API tokens or S3 API tokens area.",
      "Create a token with permission to access the bucket you want this app to use.",
      "Copy both the Access Key ID and Secret Access Key, then paste them into the settings form.",
    ],
    title: "Cloudflare R2 Credentials",
  },
  {
    description: "Create a reusable key for OpenRouter-powered model calls.",
    docsHref: "https://openrouter.ai/docs/api-keys",
    keyPageHref: "https://openrouter.ai/workspaces/default/keys",
    name: "OpenRouter",
    steps: [
      "Open the OpenRouter dashboard and sign in.",
      "Go to the API keys area and create a new key.",
      "Give the key a name and optionally add a credit limit.",
      "Copy the generated key and paste it into the settings form.",
    ],
    title: "OpenRouter API Key",
  },
  {
    description: "Create a secret key for OpenAI platform features.",
    docsHref:
      "https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key",
    keyPageHref: "https://platform.openai.com/settings/organization/api-keys",
    name: "OpenAI",
    steps: [
      "Open the OpenAI platform and sign in.",
      "Go to the API keys page in your organization settings.",
      "Create a new secret key and copy it when it is shown.",
      "Paste that key into the settings form on the left.",
    ],
    title: "OpenAI API Key",
  },
] as const

export type ApiKeyGuideSection = "cloudflare-r2" | "openai" | "openrouter"

const guideBySection: Record<
  ApiKeyGuideSection,
  (typeof providerGuides)[number]
> = {
  "cloudflare-r2": providerGuides[0],
  openai: providerGuides[2],
  openrouter: providerGuides[1],
}

export function ApiKeyGuideCard({ section }: { section: ApiKeyGuideSection }) {
  const guide = guideBySection[section]

  return (
    <Card className="w-full lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle>How To Get API Keys</CardTitle>
        <CardDescription>
          Follow the provider steps, then paste the keys into the matching form
          fields.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-medium text-sm">{guide.title}</h2>
            <p className="text-muted-foreground text-xs/relaxed">
              {guide.description}
            </p>
          </div>

          <ol className="ml-4 flex list-decimal flex-col gap-2 text-xs/relaxed">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={guide.docsHref} rel="noopener" target="_blank">
                {guide.name} docs
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href={guide.keyPageHref} rel="noopener" target="_blank">
                Open key page
              </a>
            </Button>
          </div>
        </section>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <p className="text-muted-foreground text-xs/relaxed">
          Keep both keys secret. Do not expose them in client-side production
          code.
        </p>
      </CardFooter>
    </Card>
  )
}
