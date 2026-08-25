import Link from "next/link";
import { Compass } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { PathQuiz } from "@/components/path-quiz";
import { getAllPaths } from "@/lib/content";

export const metadata: Metadata = {
  title: "Which AI path is right for me?",
  description:
    "Four questions to narrow seven AI engineering career paths down to one. Covers AI Engineer, ML Engineer, Agentic AI, GenAI, Full Stack AI and the hybrid track. No signup.",
  keywords: [
    "which AI career path",
    "AI engineer or ML engineer",
    "AI career quiz",
    "what AI role should I choose",
  ],
  openGraph: {
    type: "website",
    title: "Which AI engineering path is right for you?",
    description: "Four questions, seven paths, one recommendation.",
    url: "/quiz/",
  },
  alternates: { canonical: "/quiz/" },
};

export default function QuizPage() {
  const paths = getAllPaths().map((path) => ({
    slug: path.slug,
    title: path.title,
    shortTitle: path.shortTitle,
    tagline: path.tagline,
    accent: path.accent,
    flagship: path.flagship,
    stageCount: path.stages.length,
  }));

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_30%_10%,rgba(139,92,246,0.14),transparent_70%)]"
          aria-hidden
        />

        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal from="none">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              <Compass className="size-3.5" aria-hidden />
              Four questions · nothing stored
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Which path is right for me?
            </h1>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
              Four questions about what you want to build, how you feel about
              the maths, and where you are starting from. It runs entirely in
              your browser and points at one of the seven paths.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <PathQuiz paths={paths} />

        {/* Server-rendered so the page is not an empty shell to a crawler,
            and so the paths are reachable without running the quiz. */}
        <section aria-labelledby="all-paths" className="mt-16 border-t border-border/60 pt-10">
          <h2
            id="all-paths"
            className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >
            Or skip it — all seven paths
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {paths.map((path) => (
              <li key={path.slug}>
                <Link
                  href={`/paths/${path.slug}/`}
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <span className="font-medium text-foreground">
                    {path.title}
                  </span>
                  <span className="mt-0.5 block text-xs">{path.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
