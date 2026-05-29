import {
  IconArrowRight,
  IconCloudComputing,
  IconKey,
  IconRocket,
  IconRosetteDiscountCheck,
  IconSettings,
  IconVideo,
} from "@tabler/icons-react"
import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { db } from "@/db"
import { userSettings } from "@/db/schema/user-settings"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Getting Started | OpenVideoLab",
  description:
    "Set up OpenRouter and storage credentials, then generate your first video in OpenVideoLab.",
}

const getStatusVariant = (configured: boolean) =>
  configured ? "secondary" : "outline"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return redirect("/sign-in")
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1)

  const hasOpenRouterKey = Boolean(settings?.openrouterApiKey?.trim())
  const hasOpenAiKey = Boolean(settings?.openaiApiKey?.trim())
  const hasR2Storage = Boolean(
    settings?.cloudflareAccessKeyId?.trim() &&
      settings.cloudflareR2EndpointUrl?.trim() &&
      settings.cloudflareSecretAccessKey?.trim()
  )

  const setupProgressCount = [
    hasOpenRouterKey,
    hasR2Storage,
    hasOpenAiKey,
  ].filter(Boolean).length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
      <Card>
        <CardHeader>
          <CardAction>
            <Badge variant={hasOpenRouterKey ? "secondary" : "outline"}>
              {hasOpenRouterKey ? "Ready to generate" : "Setup required"}
            </Badge>
          </CardAction>
          <div className="flex items-center gap-2">
            <IconRocket size={20} />
            <CardTitle>Set up OpenVideoLab in three steps</CardTitle>
          </div>
          <CardDescription>
            Add your OpenRouter API key first, optionally finish storage and
            backup providers, then go to New Video to start generating.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{setupProgressCount}/3 configured</Badge>
            <Badge variant={getStatusVariant(hasOpenRouterKey)}>
              OpenRouter {hasOpenRouterKey ? "configured" : "missing"}
            </Badge>
            <Badge variant={getStatusVariant(hasR2Storage)}>
              Cloudflare R2 {hasR2Storage ? "configured" : "missing"}
            </Badge>
            <Badge variant={getStatusVariant(hasOpenAiKey)}>
              OpenAI {hasOpenAiKey ? "configured" : "optional"}
            </Badge>
          </div>

          <p className="text-muted-foreground">
            The minimum path is simple: open{" "}
            <span className="font-medium text-foreground">Settings</span>, paste
            an OpenRouter API key, save, and then create your first video. If
            you plan to upload reference images or keep generated files in
            storage, complete the Cloudflare R2 fields too.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t">
          <Button asChild size="lg">
            <Link href={hasOpenRouterKey ? "/videos" : "/settings"}>
              {hasOpenRouterKey ? (
                <IconVideo data-icon="inline-start" size={18} />
              ) : (
                <IconSettings data-icon="inline-start" size={18} />
              )}
              {hasOpenRouterKey ? "Go to New Video" : "Open Settings"}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={hasOpenRouterKey ? "/settings" : "/videos"}>
              {hasOpenRouterKey ? (
                <IconSettings data-icon="inline-start" size={18} />
              ) : (
                <IconVideo data-icon="inline-start" size={18} />
              )}
              {hasOpenRouterKey ? "Review API keys" : "Preview New Video"}
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardAction>
              <Badge variant={getStatusVariant(hasOpenRouterKey)}>
                {hasOpenRouterKey ? "Configured" : "Required"}
              </Badge>
            </CardAction>
            <div className="flex items-center gap-2">
              <IconKey size={18} />
              <CardTitle>1. Add OpenRouter API key</CardTitle>
            </div>
            <CardDescription>
              This is the required credential for submitting video generation
              jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p>
              Go to Settings and paste your OpenRouter API key into the matching
              field.
            </p>
            <p className="text-muted-foreground">
              If this key is missing, video generation requests will fail before
              they start.
            </p>
          </CardContent>
          <CardFooter className="border-t">
            <Button asChild variant="outline">
              <Link href="/settings">
                Open Settings
                <IconArrowRight data-icon="inline-end" size={16} />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardAction>
              <Badge variant={getStatusVariant(hasR2Storage)}>
                {hasR2Storage ? "Configured" : "Recommended"}
              </Badge>
            </CardAction>
            <div className="flex items-center gap-2">
              <IconCloudComputing size={18} />
              <CardTitle>2. Finish storage setup</CardTitle>
            </div>
            <CardDescription>
              Cloudflare R2 stores uploaded reference images and completed video
              files.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p>Add the R2 endpoint, access key ID, and secret access key.</p>
            <p className="text-muted-foreground">
              You can still start with OpenRouter first, but R2 is what makes
              uploads and persisted outputs work smoothly.
            </p>
          </CardContent>
          <CardFooter className="border-t">
            <Button asChild variant="outline">
              <Link href="/settings">
                Configure R2
                <IconArrowRight data-icon="inline-end" size={16} />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardAction>
              <Badge variant={hasOpenRouterKey ? "secondary" : "outline"}>
                {hasOpenRouterKey ? "Unlocked" : "Next"}
              </Badge>
            </CardAction>
            <div className="flex items-center gap-2">
              <IconVideo size={18} />
              <CardTitle>3. Generate your first video</CardTitle>
            </div>
            <CardDescription>
              Open the New Video screen, write a prompt, choose your format, and
              submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p>
              Use the sidebar or the button below to open the video creation
              flow.
            </p>
            <p className="text-muted-foreground">
              Start with a short prompt and 720p if you want a low-friction
              first run.
            </p>
          </CardContent>
          <CardFooter className="border-t">
            {hasOpenRouterKey ? (
              <Button asChild>
                <Link href="/videos">
                  New Video
                  <IconArrowRight data-icon="inline-end" size={16} />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/settings">
                  Add key first
                  <IconArrowRight data-icon="inline-end" size={16} />
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconRosetteDiscountCheck size={20} />
            <CardTitle>Quick checklist</CardTitle>
          </div>
          <CardDescription>
            Use this flow when you are setting up a fresh account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <p>1. Open Settings and save your OpenRouter API key.</p>
              <p>
                2. Add Cloudflare R2 credentials if you want stored outputs and
                image references.
              </p>
              <p>
                3. Optionally add an OpenAI key for features that depend on
                OpenAI later.
              </p>
              <p>
                4. Go to New Video and submit a short first prompt to verify
                everything works.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="font-medium text-foreground text-sm">
                Suggested first run
              </p>
              <Separator className="my-3" />
              <div className="flex flex-col gap-2 text-muted-foreground">
                <p>Resolution: 720p</p>
                <p>Duration: 5 or 10 seconds</p>
                <p>Prompt: one subject, one action, one camera move</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
