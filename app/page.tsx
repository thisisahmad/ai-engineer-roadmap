import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

import { HeroHeadline } from "@/components/motion/hero-headline";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { GridBackdrop } from "@/components/motion/grid-backdrop";
import { StatCounter } from "@/components/motion/stat-counter";
import { FaqSection } from "@/components/faq-section";
import { PathCard } from "@/components/path-card";
import { HeroVisual } from "@/components/three/hero-visual";
import { Button } from "@/components/ui/button";
import { accent } from "@/lib/accents";
import {
  getAllPaths,
  getCareerLadder,
  getFaq,
  getFoundation,
  getProjects,
} from "@/lib/content";
import { cn } from "@/lib/utils";
import { countResources, countStageResources } from "@/lib/stages";

export const metadata: Metadata = {
  // The homepage was the one route inheriting layout defaults with no
  // canonical of its own, which leaves the root URL open to being indexed
  // under query-string and trailing-slash variants.
  title: "Seven routes into AI engineering",
  description:
    "Stage-by-stage career roadmaps for AI engineering: AI Engineer, ML Engineer, Agentic AI, GenAI, Full Stack AI and more. What to learn, in what order, with free resources at every stage.",
  keywords: [
    "AI engineer roadmap",
    "ML engineer roadmap",
    "how to become an AI engineer",
    "agentic AI engineer",
    "AI career path",
  ],
  openGraph: {
    type: "website",
    title: "Seven routes into AI engineering",
    description:
      "Stage-by-stage career roadmaps with free resources at every stage.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const paths = getAllPaths();
  const foundation = getFoundation();
  const ladder = getCareerLadder();
  const projects = getProjects();
  const faq = getFaq();

  const totalStages =
    paths.reduce((n, p) => n + p.stages.length, 0) + foundation.stages.length;
  const totalResources =
    paths.reduce((n, p) => n + countResources(p.stages), 0) +
    countResources(foundation.stages);

  const heroStats = [
    { value: paths.length, label: "career paths" },
    { value: totalStages, label: "stages" },
    { value: totalResources, label: "resources" },
    { value: projects.items.length, label: "projects" },
  ];

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden">
        <HeroVisual />

        <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-32 lg:pb-40 lg:pt-40">
          <ScrollReveal className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-sm">
              <Sparkles className="size-3.5" aria-hidden />
              Built from a working team&apos;s roadmap, not a listicle
            </p>

            <HeroHeadline
              lead="Seven routes into"
              accent="AI engineering"
              className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            />

            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Pick the role you actually want. Every path breaks into ordered
              stages, and every stage tells you what to cover, what to build,
              and exactly what to read — free wherever free exists.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group">
                <Link href="#paths">
                  Explore the paths
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/foundation/">Start from zero</Link>
              </Button>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-4 gap-6">
              {heroStats.map((stat, i) => (
                <StatCounter
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  // Starts once the headline has finished resolving, so the
                  // hero plays one animation at a time rather than three.
                  delay={0.9 + i * 0.08}
                  className="text-3xl font-semibold tabular-nums tracking-tight"
                />
              ))}
            </dl>
          </ScrollReveal>
        </div>
      </section>

      {/* --------------------------------------------------------- Paths */}
      <section
        id="paths"
        className="relative isolate scroll-mt-20 px-4 py-24 sm:px-6"
      >
        {/* Pure CSS lattice + bloom: crisp at any DPI, free on mobile. */}
        <GridBackdrop pattern="dots" bloom="violet" />

        <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-12 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-violet-400">
            <Route className="size-3.5" aria-hidden />
            The paths
          </p>
          <h2 className="font-display text-balance text-3xl tracking-tight sm:text-4xl">
            Choose where you are going.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            They overlap more than the job titles suggest — several stages are
            the same material, and each path says so where that is true. Open
            one for the full stage-by-stage breakdown.
          </p>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => {
            const { stages, ...summary } = path;
            return (
              <ScrollReveal key={path.slug} className="h-full">
                <PathCard
                  path={summary}
                  stageCount={stages.length}
                  resourceCount={stages.reduce(
                    (n, s) => n + countStageResources(s),
                    0,
                  )}
                  firstStages={stages.slice(0, 3).map((s) => s.title)}
                />
              </ScrollReveal>
            );
          })}

          {/* Seventh slot in a 3-col grid — the foundation, which every path
              assumes, sits naturally at the end of the set. */}
          <ScrollReveal className="h-full">
            <Link
              href="/foundation/"
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:bg-card/50"
            >
              <div>
                <Layers className="size-5 text-violet-400" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold tracking-tight">
                  {foundation.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {foundation.subtitle}. The ground floor under all seven paths
                  — Python, the terminal, HTTP, APIs, databases, Git and Docker.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-violet-400">
                Start here
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          </ScrollReveal>
        </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Comparison */}
      <section
        id="compare"
        className="relative border-y border-border/60 bg-gradient-to-b from-muted/30 to-transparent"
      >
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <ScrollReveal className="mb-10 max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-400">
              <Target className="size-3.5" aria-hidden />
              Not sure which
            </p>
            <h2 className="font-display text-balance text-3xl tracking-tight sm:text-4xl">
              What each role actually does.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              The titles are used loosely across the industry. This is the short
              version of the real difference.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            {/* Scrolls inside its own container so the page body never scrolls
                sideways on a phone. */}
            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <caption className="sr-only">
                  Comparison of the seven AI engineering roles
                </caption>
                <thead className="border-b border-border/60 bg-white/[0.03]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-medium">Role</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      What they actually do
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Trains models?
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Core focus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((path) => {
                    const a = accent(path.accent);
                    return (
                      <tr
                        key={path.slug}
                        className="border-b border-border/40 transition-colors last:border-0 hover:bg-white/[0.03]"
                      >
                        <th scope="row" className="px-5 py-4 font-medium">
                          <Link
                            href={`/paths/${path.slug}/`}
                            className="flex items-center gap-2.5 underline-offset-4 hover:underline"
                          >
                            <span
                              className={cn(
                                "size-2 shrink-0 rounded-full",
                                a.dot,
                              )}
                              aria-hidden
                            />
                            {path.title}
                          </Link>
                        </th>
                        <td className="px-5 py-4 text-muted-foreground">
                          {path.role.whatTheyDo}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs",
                              path.role.trainsModels === "Yes"
                                ? "border-emerald-500/40 text-emerald-400"
                                : path.role.trainsModels === "No"
                                  ? "border-border text-muted-foreground"
                                  : "border-amber-500/40 text-amber-400",
                            )}
                          >
                            {path.role.trainsModels}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {path.role.coreFocus}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------------------------------------------------- The ladder */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <ScrollReveal className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-rose-400">
            Progression
          </p>
          <h2 className="font-display text-balance text-3xl tracking-tight sm:text-4xl">
            {ladder.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {ladder.intro}
          </p>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ladder.levels.map((level, i) => (
            <ScrollReveal key={level.id} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-rose-500/40 hover:bg-card/70">
                {/* Rung index doubles as the visual progression cue. */}
                <div
                  className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 to-rose-500 opacity-40 transition-opacity group-hover:opacity-100"
                  style={{ width: `${((i + 1) / ladder.levels.length) * 100}%` }}
                  aria-hidden
                />
                <p className="font-mono text-xs text-muted-foreground">
                  {level.yearsExperience}
                </p>
                <h3 className="mt-2 font-semibold tracking-tight">
                  {level.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {level.focus}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-8">
          <Button asChild variant="outline">
            <Link href="/career-ladder/">
              What changes at each level
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </ScrollReveal>
      </section>

      <FaqSection faq={faq} />

      {/* --------------------------------------------------------- Extras */}
      <section className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            {
              href: "/resources/",
              icon: BookOpen,
              title: "Resource library",
              body: "Every course in one place — and marked clearly where the course is free but the certificate is not.",
              tint: "text-amber-400",
              hover: "hover:border-amber-500/40",
            },
            {
              href: "/certifications/",
              icon: GraduationCap,
              title: "Certifications",
              body: "The vendor credentials each path points at, what they cost, and which path recommends them.",
              tint: "text-amber-400",
              hover: "hover:border-amber-500/40",
            },
          ].map((item) => (
            <ScrollReveal key={item.href} className="h-full">
              <Link
                href={item.href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border border-border/60 bg-card/40 p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-card/70",
                  item.hover,
                )}
              >
                <item.icon className={cn("size-6", item.tint)} aria-hidden />
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <span
                  className={cn(
                    "mt-5 inline-flex items-center gap-1 text-sm font-medium",
                    item.tint,
                  )}
                >
                  Open
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </>
  );
}
