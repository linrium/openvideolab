import Link from "next/link"

const footerGroups = [
  {
    links: [
      { href: "/videos", label: "Videos" },
      { href: "/history", label: "History" },
      { href: "/", label: "Landing Page" },
    ],
    title: "Product",
  },
  {
    links: [
      { href: "/settings", label: "Settings" },
      { href: "/", label: "Documentation" },
      { href: "/", label: "API Reference" },
      { href: "/", label: "Status" },
    ],
    title: "Developer",
  },
  {
    links: [
      { href: "/", label: "Discord" },
      { href: "/", label: "GitHub" },
      { href: "/", label: "LinkedIn" },
      { href: "/", label: "YouTube" },
    ],
    title: "Connect",
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-border/80 border-t bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(220px,1.2fr)_repeat(4,minmax(120px,1fr))] lg:gap-12">
        <div className="flex flex-col gap-4">
          <Link className="w-fit font-medium text-2xl tracking-tight" href="/">
            OpenVideoLab
          </Link>
          <p className="max-w-xs text-muted-foreground text-sm leading-6">
            &copy; 2026 OpenVideoLab. A compact studio for short-form video
            prompting, setup, and review.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div className="flex flex-col gap-4" key={group.title}>
            <h2 className="font-medium text-base tracking-tight">
              {group.title}
            </h2>
            <nav aria-label={group.title} className="flex flex-col gap-2.5">
              {group.links.map((link) => (
                <Link
                  className="text-muted-foreground text-sm leading-6 transition-colors hover:text-foreground"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </footer>
  )
}
