"use client"

import { IconBrandGoogleFilled } from "@tabler/icons-react"
import Image from "next/image"
import { redirect } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

const ASCII_MAGIC_IMAGE_URL =
  "https://pub-9bff4c0d6330472ca6187f9d74658c54.r2.dev/ascii-magic.jpg"

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const session = authClient.useSession()

  const handleGoogleSignIn = async (): Promise<void> => {
    setLoading(true)

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      })
    } finally {
      setLoading(false)
    }
  }

  if (session.data) {
    return redirect("/")
  }

  return (
    <main className="grid min-h-svh bg-background md:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
      <section
        aria-label="ASCII magic portrait artwork"
        className="relative hidden min-h-svh overflow-hidden bg-muted md:block"
      >
        <Image
          alt="ASCII magic portrait artwork"
          className="object-cover"
          fill
          priority
          sizes="(min-width: 768px) 54vw, 0vw"
          src={ASCII_MAGIC_IMAGE_URL}
        />
      </section>

      <section className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <p className="font-medium text-muted-foreground text-xs">
              Open Video Lab
            </p>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-normal">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your account to continue creating.
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Use your Google account to access your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={loading}
                onClick={handleGoogleSignIn}
                size="lg"
                variant="outline"
              >
                <IconBrandGoogleFilled data-icon="inline-start" />
                {loading ? "Signing in..." : "Continue with Google"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
