"use client";

import { useReducedMotion } from "framer-motion";

import BlurText from "@/components/reactbits/BlurText";
import { cn } from "@/lib/utils";

/**
 * The hero headline, revealed word by word with React Bits' BlurText.
 *
 * This is deliberately the only animation on the headline. The hero already
 * carries the WebGL scene, so layering a gradient sweep or scramble on top
 * would put two competing motions in the same viewport.
 *
 * The gradient on "AI engineering" is static paint, not animation — it is the
 * same treatment the headline had before, kept so the brand colour survives.
 */
export function HeroHeadline({
  lead,
  accent,
  className,
}: {
  /** Plain words, revealed first. */
  lead: string;
  /** Gradient words, revealed after the lead. */
  accent: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  // Instrument Serif's italic is a true cut, not a slant, so the accent half
  // gets real editorial contrast against the roman lead rather than a fake
  // oblique. The gradient is static paint — the only motion here is the reveal.
  const gradient =
    "italic bg-gradient-to-br from-violet-200 via-violet-300 to-amber-200 bg-clip-text text-transparent";

  // Reduced motion gets the finished headline immediately — same text, same
  // contrast, no blur pass.
  if (reduced) {
    return (
      <h1 className={className}>
        {lead} <span className={gradient}>{accent}</span>.
      </h1>
    );
  }

  const leadWords = lead.split(" ").length;

  return (
    <h1 className={cn("flex flex-wrap items-baseline gap-x-[0.25em]", className)}>
      <BlurText
        as="span"
        text={lead}
        animateBy="words"
        direction="top"
        delay={90}
        stepDuration={0.3}
        className="gap-x-[0.25em]"
      />
      <BlurText
        as="span"
        text={accent}
        animateBy="words"
        direction="top"
        delay={90}
        // Picks up where the lead finishes so the line resolves left to right
        // rather than both halves landing at once.
        initialDelay={leadWords * 90}
        stepDuration={0.3}
        className={cn("gap-x-[0.25em]", gradient)}
      />
      <span aria-hidden>.</span>
    </h1>
  );
}
