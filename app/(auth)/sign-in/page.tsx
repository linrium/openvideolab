"use client"

import { GoogleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const session = authClient.useSession()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    })
    setLoading(false)
  }

  if (session.data) {
    return redirect("/")
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-base">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            disabled={loading}
            onClick={handleGoogleSignIn}
            size="lg"
            variant="outline"
          >
            <HugeiconsIcon icon={GoogleIcon} size={20} strokeWidth={2} />
            {loading ? "Signing in…" : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
