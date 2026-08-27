"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { accent } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { Path } from "@/lib/types";

/**
 * Four-question path recommender. Entirely client-side — scores are summed
 * locally and nothing is sent anywhere.
 *
 * Each answer adds weight to path slugs. Weights are deliberately shallow:
 * this is a nudge toward a starting point, not an assessment, and the result
 * screen shows the runners-up so a close call is visible rather than hidden.
 */

type Answer = {
  id: string;
  label: string;
  detail: string;
  /** slug -> weight */
  scores: Record<string, number>;
};

type Question = {
  id: string;
  prompt: string;
  help: string;
  answers: Answer[];
};

const QUESTIONS: Question[] = [
  {
    id: "output",
    prompt: "What do you want to be building?",
    help: "The single biggest fork. Everything else refines it.",
    answers: [
      {
        id: "products",
        label: "Products people use",
        detail: "Apps and features built on models that already exist",
        scores: {
          "ai-engineer": 3,
          "full-stack-ai-engineer": 2,
          "genai-engineer": 1,
        },
      },
      {
        id: "models",
        label: "The models themselves",
        detail: "Training, tuning and evaluating models from data",
        scores: { "ml-engineer": 3, "ai-ml-hybrid": 2, "genai-engineer": 1 },
      },
      {
        id: "agents",
        label: "Systems that act on their own",
        detail: "Multi-step agents that call tools and make decisions",
        scores: { "agentic-ai-engineer": 3, "ai-engineer": 1 },
      },
      {
        id: "generative",
        label: "Generative output",
        detail: "Text, image and audio generation, fine-tuned to a domain",
        scores: { "genai-engineer": 3, "ml-engineer": 1 },
      },
    ],
  },
  {
    id: "maths",
    prompt: "How do you feel about the maths?",
    help: "Linear algebra, probability, calculus. Be honest — it decides one whole path.",
    answers: [
      {
        id: "love",
        label: "That is the interesting part",
        detail: "Happy to derive things and read papers",
        scores: { "ml-engineer": 3, "ai-ml-hybrid": 2 },
      },
      {
        id: "willing",
        label: "Willing to learn it properly",
        detail: "Not a favourite, but not a blocker",
        scores: { "ai-ml-hybrid": 2, "genai-engineer": 1, "ml-engineer": 1 },
      },
      {
        id: "avoid",
        label: "I would rather build than derive",
        detail: "Prefer engineering problems to mathematical ones",
        scores: {
          "ai-engineer": 2,
          "agentic-ai-engineer": 2,
          "full-stack-ai-engineer": 2,
        },
      },
    ],
  },
  {
    id: "background",
    prompt: "Where are you starting from?",
    help: "What you already have shortens the path considerably.",
    answers: [
      {
        id: "web",
        label: "I build web applications",
        detail: "Comfortable with frontend and backend already",
        scores: { "full-stack-ai-engineer": 3, "ai-engineer": 1 },
      },
      {
        id: "data",
        label: "Data or analytics",
        detail: "Python, pandas, SQL, some statistics",
        scores: { "ml-engineer": 2, "ai-ml-hybrid": 2 },
      },
      {
        id: "backend",
        label: "Backend or infrastructure",
        detail: "APIs, services, deployment",
        scores: {
          "ai-engineer": 2,
          "agentic-ai-engineer": 2,
          "ai-ml-hybrid": 1,
        },
      },
      {
        id: "new",
        label: "Fairly new to all of it",
        detail: "Starting close to the beginning",
        scores: {
          "full-stack-engineer": 3,
          "ai-engineer": 1,
        },
      },
    ],
  },
  {
    id: "scope",
    prompt: "What kind of team do you want to work on?",
    help: "Breadth versus depth, roughly.",
    answers: [
      {
        id: "startup",
        label: "Small team, I own the whole thing",
        detail: "One person covering the full lifecycle",
        scores: { "ai-ml-hybrid": 3, "full-stack-ai-engineer": 2 },
      },
      {
        id: "specialist",
        label: "Larger team, deep in one area",
        detail: "A specialist among specialists",
        scores: {
          "ml-engineer": 2,
          "agentic-ai-engineer": 2,
          "genai-engineer": 1,
        },
      },
      {
        id: "product",
        label: "Product team shipping to users",
        detail: "Close to the people using what you build",
        scores: { "full-stack-ai-engineer": 2, "ai-engineer": 2 },
      },
    ],
  },
];

type PathLite = Pick<
  Path,
  "slug" | "title" | "shortTitle" | "tagline" | "accent" | "flagship"
> & { stageCount: number };

export function PathQuiz({ paths }: { paths: PathLite[] }) {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const reduced = useReducedMotion();

  const done = step >= QUESTIONS.length;

  const ranked = useMemo(() => {
    const totals = new Map<string, number>();
    for (const question of QUESTIONS) {
      const chosen = question.answers.find((a) => a.id === picks[question.id]);
      if (!chosen) continue;
      for (const [slug, weight] of Object.entries(chosen.scores)) {
        totals.set(slug, (totals.get(slug) ?? 0) + weight);
      }
    }

    return paths
      .map((path) => ({ path, score: totals.get(path.slug) ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }, [picks, paths]);

  const top = ranked[0];
  const runnersUp = ranked.slice(1, 3).filter((entry) => entry.score > 0);
  const maxScore = Math.max(...ranked.map((entry) => entry.score), 1);

  const choose = (questionId: string, answerId: string) => {
    setPicks((current) => ({ ...current, [questionId]: answerId }));
    setStep((current) => current + 1);
  };

  const restart = () => {
    setPicks({});
    setStep(0);
  };

  const fade = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: "easeOut" as const },
      };

  /* ------------------------------------------------------------ result */
  if (done && top) {
    const a = accent(top.path.accent);

    return (
      <motion.div key="result" {...fade}>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Best match
        </p>

        <div
          className={cn(
            "mt-4 rounded-2xl border p-6 sm:p-8",
            a.border,
            a.bg,
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl tracking-tight">
              {top.path.title}
            </h2>
            {top.path.flagship ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-300">
                <Star className="size-3 fill-current" aria-hidden />
                Flagship
              </span>
            ) : null}
          </div>

          <p className="mt-3 leading-relaxed text-muted-foreground">
            {top.path.tagline}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {top.path.stageCount} stages, ending at the same architect track
            every path points to.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/paths/${top.path.slug}/`}>
                Open this path
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" onClick={restart}>
              <RotateCcw className="size-4" aria-hidden />
              Start over
            </Button>
          </div>
        </div>

        {runnersUp.length > 0 ? (
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Also close
            </p>
            <ul className="mt-3 space-y-2">
              {runnersUp.map(({ path, score }) => {
                const ra = accent(path.accent);
                return (
                  <li key={path.slug}>
                    <Link
                      href={`/paths/${path.slug}/`}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 p-3.5 transition-colors hover:border-border hover:bg-white/[0.03]"
                    >
                      <span
                        className={cn("size-2 shrink-0 rounded-full", ra.dot)}
                        aria-hidden
                      />
                      <span className="flex-1">
                        <span className="text-sm font-medium">
                          {path.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {path.tagline}
                        </span>
                      </span>
                      {/* Relative strength, so a near-tie is visible. */}
                      <span
                        className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-white/10"
                        aria-hidden
                      >
                        <span
                          className={cn("block h-full rounded-full", ra.dot)}
                          style={{ width: `${(score / maxScore) * 100}%` }}
                        />
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          This is a starting point, not a verdict. The paths overlap heavily —
          the shared foundation is identical across all seven, and LLM
          fundamentals and RAG are the same material in four of them.
        </p>
      </motion.div>
    );
  }

  /* ---------------------------------------------------------- question */
  const question = QUESTIONS[step];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted-foreground">
          {step + 1} / {QUESTIONS.length}
        </p>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Back
          </button>
        ) : null}
      </div>

      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={QUESTIONS.length}
        aria-label="Quiz progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-300"
          style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <motion.div key={question.id} {...fade} className="mt-8">
        <h2 className="font-display text-balance text-2xl tracking-tight">
          {question.prompt}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{question.help}</p>

        <ul className="mt-6 space-y-3">
          {question.answers.map((answer) => (
            <li key={answer.id}>
              <button
                type="button"
                onClick={() => choose(question.id, answer.id)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5",
                  picks[question.id] === answer.id
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-border/60 hover:border-violet-500/40 hover:bg-white/[0.03]",
                )}
              >
                <span className="text-sm font-medium">{answer.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {answer.detail}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
