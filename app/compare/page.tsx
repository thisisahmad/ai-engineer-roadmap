import Link from "next/link";
import { ArrowRight, Check, Compass, Minus } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { accent } from "@/lib/accents";
import { getAllPaths } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Engineer vs ML Engineer vs Agentic AI vs GenAI Engineer",
  description:
    "The four AI engineering roles compared: what each one actually builds, whether they train models, the maths required, and which to pick. Plain answers, not a job-board summary.",
  keywords: [
    "AI engineer vs ML engineer",
    "what is an agentic AI engineer",
    "GenAI engineer vs AI engineer",
    "difference between AI and ML engineer",
    "AI engineering roles compared",
  ],
  openGraph: {
    type: "article",
    title: "AI Engineer vs ML Engineer vs Agentic AI vs GenAI Engineer",
    description:
      "What each role actually builds, and how to tell which one you want.",
    url: "/compare/",
  },
  alternates: { canonical: "/compare/" },
};

/** The four the page is written about. Order is the narrative order. */
const FEATURED = [
  "ai-engineer",
  "ml-engineer",
  "agentic-ai-engineer",
  "genai-engineer",
] as const;

/**
 * Prose, written per role. Kept here rather than in content/ because it is
 * specific to this page rather than describing the path itself.
 */
const NOTES: Record<
  string,
  { headline: string; body: string; pickIf: string[]; avoidIf: string }
> = {
  "ai-engineer": {
    headline: "The default answer for most people",
    body: "An AI Engineer builds products on top of models somebody else trained. The work is API integration, retrieval, prompt design, cost control and deployment — closer to backend engineering than to research. You will spend more time on chunking strategies and token budgets than on gradients, and the hardest problems are usually reliability and cost rather than model quality. It is the shortest route from working engineer to shipping something with AI in it.",
    pickIf: [
      "You already write backend code and want to ship AI features",
      "You would rather solve engineering problems than mathematical ones",
      "You want the fastest path to something in production",
    ],
    avoidIf:
      "You want to understand models from the inside, or the job you want says research.",
  },
  "ml-engineer": {
    headline: "The one with real maths in it",
    body: "An ML Engineer trains models rather than calling them. That means linear algebra, probability and calculus are load-bearing, not background — and the path starts with them for exactly that reason. The work runs from feature engineering and experiment tracking through to serving and drift monitoring. It is the only one of the four where training from scratch is the job, and it is the slowest to get started in because the foundation is genuinely deeper.",
    pickIf: [
      "The maths is the interesting part, not the toll",
      "You want to work on the model itself, not the product around it",
      "You are willing to spend longer before you ship",
    ],
    avoidIf:
      "You want to be building user-facing products within a few months.",
  },
  "agentic-ai-engineer": {
    headline: "The newest, and the deepest here",
    body: "An Agentic AI Engineer builds systems that take multiple steps on their own — calling tools, holding state, recovering from their own mistakes. It builds on the same LLM and RAG foundation as the AI Engineer path, then adds async programming, orchestration frameworks, graph thinking, guardrails and tracing. The senior end of it is genuinely uncharted: multi-agent orchestration at scale has no good course, which is why that stage of the path is written from production experience rather than linked out to.",
    pickIf: [
      "You want the least crowded specialism of the four",
      "Distributed systems and orchestration appeal to you",
      "You are comfortable working where the documentation runs out",
    ],
    avoidIf:
      "You want a well-trodden path with an obvious curriculum at the senior end.",
  },
  "genai-engineer": {
    headline: "The one that sometimes trains models",
    body: "A GenAI Engineer works on generative output — text, images, audio — and is the only path here besides ML Engineer that touches training, though usually as fine-tuning rather than from scratch. The defining skill is knowing when to fine-tune and when retrieval would have been cheaper and better, which is a judgement most people get wrong in the expensive direction. Evaluation matters more here than anywhere else, because generative quality is hard to measure and easy to fool yourself about.",
    pickIf: [
      "You want to work on generative quality specifically",
      "Multimodal work interests you more than pure text",
      "You are prepared to learn evaluation properly",
    ],
    avoidIf:
      "You want a role where correctness is easy to define and test.",
  },
};

export default function ComparePage() {
  const all = getAllPaths();
  const featured = FEATURED.map(
    (slug) => all.find((path) => path.slug === slug)!,
  ).filter(Boolean);

  const others = all.filter(
    (path) => !FEATURED.includes(path.slug as (typeof FEATURED)[number]),
  );

  /* Comparison rows, derived from the path data where it exists so the table
     cannot drift out of step with the path pages. */
  const rows = [
    {
      label: "Trains models",
      value: (slug: string) =>
        all.find((p) => p.slug === slug)?.role.trainsModels ?? "",
    },
    {
      label: "Core focus",
      value: (slug: string) =>
        all.find((p) => p.slug === slug)?.role.coreFocus ?? "",
    },
    {
      label: "Stages",
      value: (slug: string) =>
        `${all.find((p) => p.slug === slug)?.stages.length ?? 0}`,
    },
    {
      label: "Maths load",
      value: (slug: string) =>
        ({
          "ai-engineer": "Low",
          "ml-engineer": "High",
          "agentic-ai-engineer": "Low to moderate",
          "genai-engineer": "Moderate",
        })[slug] ?? "",
    },
    {
      label: "Time to first shipped thing",
      value: (slug: string) =>
        ({
          "ai-engineer": "Shortest",
          "ml-engineer": "Longest",
          "agentic-ai-engineer": "Short, then deep",
          "genai-engineer": "Moderate",
        })[slug] ?? "",
    },
  ];

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_30%_10%,rgba(139,92,246,0.14),transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_45%_at_85%_25%,rgba(251,191,36,0.08),transparent_70%)]"
          aria-hidden
        />

        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal from="none">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              AI Engineer vs ML Engineer vs Agentic AI vs GenAI Engineer
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              These four titles are used loosely enough that job adverts for the
              same work carry different ones, and adverts with the same title
              describe different jobs. The difference that actually matters is
              narrow: whether you train models, and how many steps of reasoning
              your system runs on its own.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {/* ------------------------------------------------ short answer */}
        <Reveal>
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">
              The short answer
            </h2>
            <dl className="mt-5 space-y-3 text-sm leading-relaxed">
              {[
                [
                  "AI Engineer",
                  "builds products using models that already exist.",
                ],
                [
                  "ML Engineer",
                  "trains the models. This is the one with real maths in it.",
                ],
                [
                  "Agentic AI Engineer",
                  "builds systems that take multiple steps on their own.",
                ],
                [
                  "GenAI Engineer",
                  "works on generative output, and fine-tunes when retrieval is not enough.",
                ],
              ].map(([role, rest]) => (
                <div key={role} className="flex gap-2">
                  <dt className="shrink-0 font-medium text-foreground">
                    {role}
                  </dt>
                  <dd className="text-muted-foreground">{rest}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* ---------------------------------------------------- the table */}
        <section aria-labelledby="side-by-side" className="mt-16">
          <Reveal className="mb-6">
            <h2
              id="side-by-side"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Side by side
            </h2>
          </Reveal>

          <Reveal>
            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/30">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <caption className="sr-only">
                  AI Engineer, ML Engineer, Agentic AI Engineer and GenAI
                  Engineer compared
                </caption>
                <thead className="border-b border-border/60 bg-white/[0.03]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      <span className="sr-only">Attribute</span>
                    </th>
                    {featured.map((path) => {
                      const a = accent(path.accent);
                      return (
                        <th
                          key={path.slug}
                          scope="col"
                          className="px-5 py-3.5 font-medium"
                        >
                          <Link
                            href={`/paths/${path.slug}/`}
                            className="flex items-center gap-2 underline-offset-4 hover:underline"
                          >
                            <span
                              className={cn(
                                "size-2 shrink-0 rounded-full",
                                a.dot,
                              )}
                              aria-hidden
                            />
                            {path.shortTitle}
                          </Link>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border/40 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {row.label}
                      </th>
                      {featured.map((path) => (
                        <td
                          key={path.slug}
                          className="px-5 py-4 text-muted-foreground"
                        >
                          {row.value(path.slug)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        {/* ------------------------------------------------- role by role */}
        <section aria-labelledby="role-by-role" className="mt-20">
          <Reveal className="mb-8">
            <h2
              id="role-by-role"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Role by role
            </h2>
          </Reveal>

          <div className="space-y-12">
            {featured.map((path, i) => {
              const a = accent(path.accent);
              const note = NOTES[path.slug];

              return (
                <Reveal key={path.slug} delay={Math.min(i, 4) * 0.04}>
                  <article
                    className={cn(
                      "rounded-2xl border p-6 sm:p-8",
                      a.border,
                      a.bg,
                    )}
                  >
                    <h3 className="text-xl font-semibold tracking-tight">
                      <Link
                        href={`/paths/${path.slug}/`}
                        className="underline-offset-4 hover:underline"
                      >
                        {path.title}
                      </Link>
                    </h3>
                    <p className={cn("mt-1 text-sm", a.text)}>
                      {note.headline}
                    </p>

                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      {note.body}
                    </p>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Pick this if
                        </h4>
                        <ul className="mt-2.5 space-y-2">
                          {note.pickIf.map((reason) => (
                            <li
                              key={reason}
                              className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                            >
                              <Check
                                className={cn("mt-0.5 size-3.5 shrink-0", a.text)}
                                aria-hidden
                              />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Look elsewhere if
                        </h4>
                        <p className="mt-2.5 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                          <Minus
                            className="mt-0.5 size-3.5 shrink-0 opacity-60"
                            aria-hidden
                          />
                          {note.avoidIf}
                        </p>
                      </div>
                    </div>

                    <Button asChild variant="outline" size="sm" className="mt-6">
                      <Link href={`/paths/${path.slug}/`}>
                        {path.stages.length}-stage roadmap
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </Button>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ----------------------------------------------- what they share */}
        <section aria-labelledby="overlap" className="mt-20">
          <Reveal>
            <h2
              id="overlap"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              What they share
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              More than the titles suggest. All four sit on the same shared
              foundation — Python, HTTP, APIs, databases and the standard
              toolchain — and three of them start from the same LLM fundamentals
              and RAG material. Every path here also ends at the same place: a
              single AI System Architect track, because at that level the job
              stops being about frameworks and becomes system-level judgement.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              That overlap is why switching early is cheap. The expensive move
              is crossing into or out of ML Engineer, since that is the one
              built on maths the others never touch.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/foundation/">Shared foundation</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/career-ladder/">
                  <Compass className="size-4" aria-hidden />
                  Career ladder
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>

        {/* ------------------------------------------------------ the rest */}
        <section aria-labelledby="other-paths" className="mt-20">
          <Reveal>
            <h2
              id="other-paths"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              The other three paths
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              This page compares the four roles people most often confuse. Three
              more sit alongside them.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {others.map((path) => {
                const a = accent(path.accent);
                return (
                  <li key={path.slug}>
                    <Link
                      href={`/paths/${path.slug}/`}
                      className="group flex h-full flex-col rounded-xl border border-border/60 p-4 transition-colors hover:border-border hover:bg-white/[0.03]"
                    >
                      <span
                        className={cn("size-2 rounded-full", a.dot)}
                        aria-hidden
                      />
                      <span className="mt-3 text-sm font-medium">
                        {path.title}
                      </span>
                      <span className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                        {path.tagline}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </section>

        <Reveal className="mt-20">
          <div className="rounded-2xl border border-border/60 bg-card/30 p-6 text-center sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">
              Still not sure?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Four questions about what you want to build and where you are
              starting from, and it points at one.
            </p>
            <Button asChild className="mt-5">
              <Link href="/quiz/">
                Take the quiz
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
