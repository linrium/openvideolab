import Link from "next/link"
import { Button } from "@/components/ui/button"

const navigationLinks = [{ href: "/", label: "Videos" }] as const

const accountLinks = [
  { href: "/settings", label: "Settings", variant: "ghost" },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-border/80 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            className="truncate font-medium text-sm tracking-tight"
            href="/"
          >
            OpenVideoLab
          </Link>
        </div>

        <nav aria-label="Primary" className="flex items-center gap-2">
          {navigationLinks.map((link) => (
            <Button asChild key={link.href} size="sm" variant="ghost">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {accountLinks.map((link) => (
            <Button asChild key={link.href} size="sm" variant={link.variant}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  )
}
