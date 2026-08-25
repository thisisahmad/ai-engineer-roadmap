import Link from "next/link";
import { Route } from "lucide-react";

import { getPathSummaries } from "@/lib/content";
import { brand } from "@/lib/site";

const SITE_LINKS = [
  { href: "/quiz/", label: "Which path quiz" },
  { href: "/compare/", label: "Compare roles" },
  { href: "/foundation/", label: "Shared foundation" },
  { href: "/career-ladder/", label: "Career ladder" },
  { href: "/resources/", label: "Resource library" },
  { href: "/certifications/", label: "Certifications" },
];

export function SiteFooter() {
  const paths = getPathSummaries();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight"
            >
              <Route className="size-5 text-violet-500" aria-hidden />
              {brand.name}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {brand.description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Built by{" "}
              <a
                href={brand.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {brand.author}
              </a>
            </p>
          </div>

          {/* Paths, read from content so a new file appears here automatically */}
          <nav aria-labelledby="footer-paths">
            <h2
              id="footer-paths"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Paths
            </h2>
            <ul className="mt-3 space-y-2">
              {paths.map((path) => (
                <li key={path.slug}>
                  <Link
                    href={`/paths/${path.slug}/`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {path.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-site">
            <h2
              id="footer-site"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Site
            </h2>
            <ul className="mt-3 space-y-2">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {brand.name}
          </p>
          <p className="max-w-xl text-xs text-muted-foreground">
            Re-verify external links before relying on them — course platforms
            restructure pricing and access often.
          </p>
        </div>
      </div>
    </footer>
  );
}
