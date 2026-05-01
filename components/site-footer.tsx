import Link from "next/link"

const footerLinks = [
  { href: "/settings", label: "Settings" },
  { href: "/", label: "Docs" },
  { href: "/", label: "Status" },
  { href: "/", label: "GitHub" },
  { href: "/", label: "Discord" },
] as const

export function SiteFooter() {
  return (
    <footer className="border-border/80 border-t bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] lg:items-end">
          <div className="flex flex-col gap-4">
            <Link
              className="w-fit font-heading text-3xl tracking-tight"
              href="/"
            >
              OpenVideoLab
            </Link>
            <p className="max-w-md text-muted-foreground text-sm leading-6">
              A focused workspace for short-form video generation, credential
              setup, and production review.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="text-[0.6875rem] text-muted-foreground uppercase tracking-[0.24em]">
              Navigation
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-4 gap-y-2 lg:justify-end"
            >
              {footerLinks.map((link) => (
                <Link
                  className="text-sm transition-colors hover:text-foreground"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-border/70 border-t pt-4 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 OpenVideoLab</p>
          <p>Built for compact scene iteration and studio operations.</p>
        </div>
      </div>
    </footer>
  )
}
