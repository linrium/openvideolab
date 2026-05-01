import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const featureCards = [
  {
    description:
      "Write a scene once, then adapt it into multiple formats, moods, and durations without rebuilding the workflow.",
    title: "Prompt Once, Recut Fast",
  },
  {
    description:
      "Keep provider keys, generation settings, and storage credentials in one place so projects stay operational.",
    title: "Centralized Studio Setup",
  },
  {
    description:
      "Track drafts, queued jobs, renders, and completed scenes with a clean production-oriented history view.",
    title: "Production History",
  },
] as const

const workflowSteps = [
  {
    body: "Save your OpenRouter, OpenAI, and Cloudflare R2 credentials in Settings before generating anything.",
    label: "Configure",
  },
  {
    body: "Shape prompts, durations, and output style around short-form scenes built for iteration.",
    label: "Direct",
  },
  {
    body: "Review generation history, compare scene attempts, and keep the strongest cuts moving forward.",
    label: "Refine",
  },
] as const

const metrics = [
  { label: "Scene-first workflow", value: "Built for shorts" },
  { label: "Storage-ready output", value: "R2 compatible" },
  { label: "Iteration mindset", value: "Fast revisions" },
] as const

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-14 sm:px-6 sm:py-18">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-end">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Badge variant="outline">Short-drama video studio</Badge>
            <div className="flex max-w-4xl flex-col gap-4">
              <h1 className="max-w-4xl font-heading text-4xl tracking-tight sm:text-5xl">
                Build short-form video scenes with a cleaner production loop.
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6 sm:text-base">
                OpenVideoLab gives you a simple surface for provider setup,
                generation workflows, and history review so you can focus on
                scene quality instead of tooling overhead.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/settings">Open Settings</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/history">View History</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <Card className="bg-muted/30" key={metric.label} size="sm">
                <CardHeader>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-sm">{metric.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/40">
          <CardHeader>
            <CardTitle>Studio Snapshot</CardTitle>
            <CardDescription>
              A compact workflow for teams or solo creators moving from prompt
              to rendered scene.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3">
              {workflowSteps.map((step, index) => (
                <div className="flex flex-col gap-2" key={step.label}>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{`0${index + 1}`}</Badge>
                    <div className="font-medium text-sm">{step.label}</div>
                  </div>
                  <p className="pl-11 text-muted-foreground text-xs leading-5">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="grid gap-4 lg:grid-cols-3">
        {featureCards.map((feature) => (
          <Card className="h-full border-border/70" key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:items-center">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-2xl tracking-tight">
            Start with the operational pieces, then iterate on scenes.
          </h2>
          <p className="max-w-2xl text-muted-foreground text-sm leading-6">
            The current app is already set up for credentials, history, and a
            scene-generation workflow. The landing page keeps the entry point
            focused and pushes users toward the next useful action.
          </p>
        </div>
        <Card className="border-border/70 bg-muted/20">
          <CardHeader>
            <CardTitle>Recommended Next Step</CardTitle>
            <CardDescription>
              Set provider credentials first so the generation flow and storage
              pipeline are ready when you need them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/settings">Configure API Keys</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
