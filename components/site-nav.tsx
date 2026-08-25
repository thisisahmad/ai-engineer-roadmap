"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Layers, Menu, Route, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { accent } from "@/lib/accents";
import { primaryNav, siteCta, brand } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Path } from "@/lib/types";

type PathLink = Pick<
  Path,
  "slug" | "title" | "shortTitle" | "tagline" | "accent" | "flagship"
>;

/**
 * The interactive half of the header. The server component above it reads the
 * paths from content and passes them down, so this never imports the loader.
 */
export function SiteNav({ paths }: { paths: PathLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Route changes do not unmount the header, so the mobile sheet would stay
  // open behind the new page without this.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (match: string) => pathname.startsWith(match);
  const onPaths = isActive("/paths");

  return (
    <>
      {/* ------------------------------------------------------- desktop */}
      <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                onPaths
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Paths
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-80">
            {paths.map((path) => {
              const a = accent(path.accent);
              return (
                <DropdownMenuItem key={path.slug} asChild>
                  <Link
                    href={`/paths/${path.slug}/`}
                    className="flex cursor-pointer items-start gap-2.5 py-2"
                  >
                    <span
                      className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.dot)}
                      aria-hidden
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {path.title}
                        {path.flagship ? (
                          <Star
                            className="size-3 fill-rose-400 text-rose-400"
                            aria-label="Flagship path"
                          />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {path.tagline}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/foundation/"
                className="flex cursor-pointer items-center gap-2.5 py-2"
              >
                <Layers className="size-4 text-violet-400" aria-hidden />
                <span className="text-sm">Shared foundation</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {primaryNav
          .filter((item) => item.match !== "/foundation")
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.match) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive(item.match)
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
      </nav>

      {/* --------------------------------------------------- cta + mobile */}
      <div className="ml-auto flex items-center gap-2 md:ml-0">
        {siteCta.enabled ? (
          <Button asChild size="sm" className="hidden sm:inline-flex">
            {siteCta.external ? (
              <a href={siteCta.href} target="_blank" rel="noopener noreferrer">
                {siteCta.label}
              </a>
            ) : (
              <Link href={siteCta.href}>{siteCta.label}</Link>
            )}
          </Button>
        ) : null}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="flex w-[85vw] max-w-sm flex-col overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Route className="size-4 text-violet-400" aria-hidden />
                {brand.name}
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-6 px-4 pb-8" aria-label="Mobile">
              <div>
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Paths
                </p>
                <div className="mt-2 flex flex-col">
                  {paths.map((path) => {
                    const a = accent(path.accent);
                    const active = pathname.startsWith(`/paths/${path.slug}`);
                    return (
                      <Link
                        key={path.slug}
                        href={`/paths/${path.slug}/`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn("size-2 shrink-0 rounded-full", a.dot)}
                          aria-hidden
                        />
                        {path.shortTitle}
                        {path.flagship ? (
                          <Star
                            className="size-3 fill-rose-400 text-rose-400"
                            aria-label="Flagship"
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Site
                </p>
                <div className="mt-2 flex flex-col">
                  {primaryNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive(item.match) ? "page" : undefined}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm transition-colors",
                        isActive(item.match)
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {siteCta.enabled ? (
                <Button asChild className="mx-3">
                  {siteCta.external ? (
                    <a
                      href={siteCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {siteCta.label}
                    </a>
                  ) : (
                    <Link href={siteCta.href}>{siteCta.label}</Link>
                  )}
                </Button>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
