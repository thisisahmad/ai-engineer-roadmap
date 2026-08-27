"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

import CountUp from "@/components/reactbits/CountUp";

/**
 * A statistic that counts up the first time it scrolls into view.
 *
 * Two things the upstream CountUp does not handle, both of which matter on a
 * statically exported site:
 *
 *  - It renders `<span ref>` empty and writes the number in via `textContent`,
 *    so the real figure is absent from the prerendered HTML. The true value is
 *    server-rendered here and only handed over to CountUp once mounted, which
 *    keeps the number present for crawlers and with JS disabled.
 *  - It has no reduced-motion handling.
 *
 * The accessible name is pinned to the final value either way, so a screen
 * reader announces "63 stages" rather than reading an animating number.
 */
export function StatCounter({
  value,
  label,
  className,
  /** Seconds. Used in the hero to start after the headline has resolved. */
  delay = 0,
}: {
  value: number;
  label: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const animate = mounted && !reduced;

  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className={className} aria-label={`${value} ${label}`}>
        <span aria-hidden>
          {animate ? (
            <CountUp to={value} duration={1.6} delay={delay} separator="" />
          ) : (
            value
          )}
        </span>
      </dd>
      <dd className="mt-0.5 text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}
