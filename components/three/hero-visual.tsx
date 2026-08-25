"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { WebGLBoundary, hasWebGL } from "./webgl-boundary";

/**
 * Decides how much scene this device should get, then mounts it.
 *
 * three.js plus the postprocessing pass is ~700KB, so it loads browser-only
 * and after first paint — the headline and CTAs are server-rendered and never
 * wait on it. Everything below degrades to the static gradient, which is a
 * complete hero on its own.
 */
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
});

type Config = {
  show: boolean;
  density: "full" | "reduced";
  animate: boolean;
  bloom: boolean;
};

const OFF: Config = {
  show: false,
  density: "reduced",
  animate: false,
  bloom: false,
};

/**
 * Bloom is the most expensive thing in the scene and the first thing to drop.
 * `deviceMemory` and `hardwareConcurrency` are coarse and not universally
 * supported, but they reliably catch the low-end devices where a full-screen
 * postprocessing pass hurts — and an absent value is treated as capable
 * rather than penalising browsers that do not report it.
 */
function isLowPower(): boolean {
  type Nav = Navigator & { deviceMemory?: number };
  const nav = navigator as Nav;

  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (
    typeof nav.hardwareConcurrency === "number" &&
    nav.hardwareConcurrency > 0 &&
    nav.hardwareConcurrency <= 4
  ) {
    return true;
  }
  return false;
}

export function HeroVisual() {
  const [config, setConfig] = useState<Config>(OFF);

  useEffect(() => {
    if (!hasWebGL()) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const lowPower = isLowPower();

    const sync = () =>
      setConfig({
        show: true,
        // Mobile keeps the scene, at half the node count.
        density: desktop.matches ? "full" : "reduced",
        // Reduced motion renders the same scene once, then never animates.
        animate: !reduceMotion.matches,
        // Dropped on low-power devices and on mobile, where the pass costs
        // most and the canvas is smallest. Emissive materials with
        // toneMapped={false} keep the nodes glowing without it.
        bloom: !lowPower && desktop.matches,
      });

    sync();
    reduceMotion.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    return () => {
      reduceMotion.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      {/* Always painted, so the hero has depth before the canvas mounts and
          wherever it never arrives. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_62%_38%,rgba(139,92,246,0.16),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_18%_72%,rgba(245,158,11,0.08),transparent_70%)]" />

      {config.show ? (
        <div className="absolute inset-0 animate-[fade-in_1.6s_ease-out_0.2s_both]">
          <WebGLBoundary>
            <HeroScene
              density={config.density}
              animate={config.animate}
              bloom={config.bloom}
            />
          </WebGLBoundary>
        </div>
      ) : null}

      {/* Fades the scene into the page background at the section boundary. */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
