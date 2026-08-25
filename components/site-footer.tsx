import Link from "next/link";

const LINKS = [
  { href: "/foundation/", label: "Shared foundation" },
  { href: "/paths/agentic-ai-engineer/", label: "Agentic AI Engineer" },
  { href: "/paths/ai-engineer/", label: "AI Engineer" },
  { href: "/paths/ml-engineer/", label: "ML Engineer" },
  { href: "/career-ladder/", label: "Career ladder" },
  { href: "/resources/", label: "Resources" },
  { href: "/certifications/", label: "Certifications" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-2">
            <p className="font-semibold tracking-tight">AI Roadmap</p>
            <p className="text-sm text-muted-foreground">
              Career roadmaps for AI engineering, merged from our team roadmap and
              current industry research. Content lives as JSON under
              <code className="text-xs">/content</code>.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm"
            aria-label="Footer"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Re-verify every external link before publishing — course platforms
          restructure pricing and access often.
        </p>
      </div>
    </footer>
  );
}
