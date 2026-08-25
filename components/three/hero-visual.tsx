"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { WebGLBoundary, hasWebGL } from "./webgl-boundary";

/**
 * Gates the WebGL hero.
 *
 * three.js is ~600KB, so it loads browser-only and after first paint. The
 * scene is skipped entirely when reduced motion is requested, on small
 * screens, or where WebGL is unavailable — and the boundary catches anything
 * it throws at runtime. In every one of those cases the static gradient below
 * is the whole background, which is a perfectly good hero on its own.
 */
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
});

export function HeroVisual() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 768px)");

    // Probed once on mount rather than per-change: WebGL availability does not
    // change while the page is open.
    const supported = hasWebGL();

    const sync = () => setEnabled(supported && !motion.matches && wide.matches);
    sync();

    motion.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      {/* Always present, so the hero has depth before the canvas mounts and
          for anyone who never gets it. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_65%_40%,rgba(139,92,246,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_15%_75%,rgba(34,211,238,0.09),transparent_70%)]" />

      {enabled ? (
        <div className="absolute inset-0 animate-[fade-in_1.6s_ease-out_0.2s_both]">
          <WebGLBoundary>
            <HeroScene />
          </WebGLBoundary>
        </div>
      ) : null}

      {/* Fades the scene into the page background at the section boundary. */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
