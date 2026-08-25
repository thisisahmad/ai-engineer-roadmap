import { Info } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { ResourceList } from "@/components/resource-list";
import { getResourceLibrary } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "The cross-path free course library for AI engineering — Anthropic Academy, freeCodeCamp, MIT 6.S191, CS50 AI, Hugging Face and more, with paid-certificate caveats marked.",
  alternates: { canonical: "/resources/" },
};

export default function ResourcesPage() {
  const library = getResourceLibrary();
  const total = library.groups.reduce(
    (sum, group) => sum + group.resources.length,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal from="none">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Resources
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {library.intro}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {total} resources. Stage-specific links live on each path page.
        </p>
      </Reveal>

      <Reveal className="mt-8">
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {library.caveat}
          </p>
        </div>
      </Reveal>

      <div className="mt-12 space-y-12">
        {library.groups.map((group, index) => (
          <Reveal key={group.id} delay={index * 0.05}>
            <section aria-labelledby={`group-${group.id}`}>
              <h2
                id={`group-${group.id}`}
                className="text-xl font-semibold tracking-tight"
              >
                {group.title}
              </h2>
              {group.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {group.description}
                </p>
              ) : null}
              <ResourceList resources={group.resources} className="mt-4" />
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
