"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Section entrance animation.
 *
 * This was built on React Bits' AnimatedContent (GSAP ScrollTrigger) and has
 * been rewritten on framer-motion, because ScrollTrigger broke client-side
 * navigation: a Next `<Link>` rendered inside AnimatedContent fired its RSC
 * request and then never committed the route, so the whole path-card grid was
 * unclickable. Verified by comparison — with `prefers-reduced-motion: reduce`,
 * which bypasses the animation entirely, the same links navigated fine.
 *
 * The API is unchanged so every call site kept working. framer-motion was
 * already a dependency and drives the rest of the site's motion.
 *
 * Two things this deliberately does that the GSAP version did not:
 *  - never renders `invisible`, so content is present without JavaScript
 *  - leaves no transform behind once the animation has landed, which is what
 *    silently re-parented absolutely positioned children
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 48,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      // framer-motion server-renders the `initial` state as inline style, so
      // without JavaScript this content would sit at opacity 0. The no-JS
      // stylesheet in app/layout.tsx keys off this attribute to restore it.
      data-scroll-reveal=""
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
