import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Hammer, Layers, Star } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import {
  PathProgressBar,
  PathProgressProvider,
} from "@/components/path-progress";
import { PathRoadmapGraph } from "@/components/path-roadmap-graph";
import { PathToc } from "@/components/path-toc";
import { ResourceList } from "@/components/resource-list";
import { StageTimeline } from "@/components/stage-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { accent } from "@/lib/accents";
import {
  getAllPathSlugs,
  getAllPaths,
  getFoundation,
  getPath,
  getProjectsForPath,
} from "@/lib/content";
import { cn } from "@/lib/utils";
import { countResources } from "@/lib/stages";

type Params = { slug: string };

/**
 * Prerenders one HTML file per file in content/paths. With
 * `dynamicParams = false`, any slug not listed here 404s at build time instead
 * of attempting a runtime render — which is what makes this route compatible
 * with `output: "export"`.
 */
export function generateStaticParams(): Params[] {
  return getAllPathSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = getPath(slug);

  if (!path) return {};

  const stageCount = path.stages.length;
  const description = `${path.tagline}. A ${stageCount}-stage roadmap from junior to AI System Architect — what to cover at each level, with free courses and certifications for every stage.`;

  return {
    title: path.title,
    description,
    keywords: [
      path.title,
      `${path.title} roadmap`,
      `how to become a ${path.title}`,
      path.role.coreFocus,
    ],
    openGraph: {
      type: "article",
      title: `${path.title} — career roadmap`,
      description,
      url: `/paths/${slug}/`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${path.title} — career roadmap`,
      description,
    },
    alternates: { canonical: `/paths/${slug}/` },
  };
}

export default async function PathPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const path = getPath(slug);

  if (!path) notFound();

  const a = accent(path.accent);
  const all = getAllPaths();
  const pathTitles = Object.fromEntries(all.map((p) => [p.slug, p.title]));
  const index = all.findIndex((p) => p.slug === slug);
  const next = all[(index + 1) % all.length];

  const foundation = getFoundation();
  const projects = getProjectsForPath(slug);
  const resourceCount = countResources(path.stages);

  const facts = [
    { label: "Path", value: path.pathLetter },
    { label: "Stages", value: `${path.stages.length}` },
    { label: "Resources", value: `${resourceCount}` },
    { label: "Trains models", value: path.role.trainsModels },
  ];

  return (
    <article>
      <header className="relative overflow-hidden border-b border-border/60">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b to-transparent opacity-60",
            a.glow,
          )}
          aria-hidden
        />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <Link
            href="/#paths"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All paths
          </Link>

          <ScrollReveal className="mt-6">
            {path.flagship ? (
              <Badge
                variant="outline"
                className="mb-4 border-rose-500/40 font-normal text-rose-400"
              >
                <Star className="size-3" aria-hidden />
                Flagship path
              </Badge>
            ) : null}

            <h1 className="text-balance text-4xl tracking-tight sm:text-5xl">
              {path.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {path.tagline}
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                What they actually do:{" "}
              </span>
              {path.role.whatTheyDo}
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd className={cn("mt-1 font-medium", a.text)}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {path.note ? (
          <ScrollReveal className="mb-12">
            <p
              className={cn(
                "rounded-xl border p-5 text-sm leading-relaxed",
                a.border,
                a.bg,
              )}
            >
              {path.note}
            </p>
          </ScrollReveal>
        ) : null}

        {path.prerequisite ? (
          <ScrollReveal className="mb-12">
            <div className="rounded-xl border border-border/60 p-5">
              <h2 className="font-semibold text-sm font-medium">Prerequisite</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {path.prerequisite}
              </p>
              {path.prerequisitePathSlug ? (
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/paths/${path.prerequisitePathSlug}/`}>
                    Open that path
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </div>
          </ScrollReveal>
        ) : null}

        {path.requiresFoundation ? (
          <ScrollReveal className="mb-16">
            <section
              aria-labelledby="foundation-heading"
              className="rounded-xl border border-border/60 bg-muted/20 p-6"
            >
              <div className="flex items-start gap-3">
                <Layers
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <h2
                    id="foundation-heading"
                    className="font-semibold tracking-tight"
                  >
                    {foundation.title}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {foundation.subtitle}
                    </span>
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {foundation.description}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {foundation.stages.map((stage) => (
                      <li key={stage.id}>
                        <Badge variant="secondary" className="font-normal">
                          {stage.title}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/foundation/">
                      Open the shared foundation
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </ScrollReveal>
        ) : null}

        {/* Overview graph. Lazy, client-only, and rendered above the stage
            list it links into — the list itself stays server-rendered. */}
        {/* Left on the plain fade deliberately. The canvas is already the
            loudest thing on the page; a GSAP reveal on top of it is the
            visual overkill the brief rules out. */}
        <Reveal className="mb-14">
          <PathRoadmapGraph path={path} />
        </Reveal>

        <PathProgressProvider slug={path.slug}>
          <section aria-labelledby="stages-heading">
            <ScrollReveal className="mb-10">
              <h2
                id="stages-heading"
                className="font-display text-2xl tracking-tight sm:text-3xl"
              >
                The stages
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Work them in order. Each stage lists the topics to cover and
                every resource from both sources — the team lead&apos;s original
                sheet and the curated 2026 roadmap.
              </p>
            </ScrollReveal>

            <ScrollReveal className="mb-10">
              <PathProgressBar
                stageIds={path.stages.map((stage) => stage.id)}
              />
            </ScrollReveal>

            {/* Server-rendered jump links. Pages run long now that every topic
                carries a definition, so this is the fast way back to a stage. */}
            <ScrollReveal className="mb-12">
              <PathToc stages={path.stages} accentName={path.accent} />
            </ScrollReveal>

            <StageTimeline
              stages={path.stages}
              accentName={path.accent}
              pathTitles={pathTitles}
              trackProgress
            />
          </section>
        </PathProgressProvider>

        {projects.length > 0 ? (
          <>
            <Separator className="my-16" />
            <section aria-labelledby="projects-heading">
              <ScrollReveal className="mb-8">
                <h2
                  id="projects-heading"
                  className="font-display text-2xl tracking-tight sm:text-3xl"
                >
                  Projects to build
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Tagged for this path. The portfolio is what gets read, not the
                  syllabus.
                </p>
              </ScrollReveal>

              <ul className="space-y-4">
                {projects.map((project) => (
                  <li key={project.id}>
                    <ScrollReveal delay={0.05}>
                      <div className="rounded-xl border border-border/60 p-5">
                        <h3 className="flex items-center gap-2 font-medium">
                          <Hammer
                            className={cn("size-4", a.text)}
                            aria-hidden
                          />
                          {project.title}
                        </h3>
                        <ResourceList
                          resources={project.resources}
                          className="mt-3"
                        />
                      </div>
                    </ScrollReveal>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        <Separator className="my-16" />

        <nav
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Path navigation"
        >
          <div>
            <p className="text-sm text-muted-foreground">Next path</p>
            <p className="font-medium">{next.title}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/paths/${next.slug}/`}>
              Open it
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </nav>
      </div>
    </article>
  );
}
