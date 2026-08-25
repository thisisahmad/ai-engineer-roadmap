"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches anything the WebGL scene throws — context-creation failure, context
 * loss, a driver bug — and renders nothing instead of taking down the page.
 *
 * The hero is decorative: the correct failure mode is that the static gradient
 * behind it is all you get. React error boundaries must be class components,
 * which is the only reason this is not a function.
 */
export class WebGLBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Surfaced in dev only. A decorative background failing is not worth
    // reporting in production.
    if (process.env.NODE_ENV === "development") {
      console.warn("[hero] WebGL scene disabled after error:", error);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Probes for a usable WebGL context before mounting the scene.
 *
 * Creating the canvas is the only reliable test — `!!window.WebGLRenderingContext`
 * is true in environments that still refuse to hand out a context (software
 * rendering disabled, GPU blocklists, some VMs and remote desktops).
 */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!context) return false;

    // Release it immediately; the real renderer will make its own.
    const lose = (context as WebGLRenderingContext).getExtension(
      "WEBGL_lose_context",
    );
    lose?.loseContext();

    return true;
  } catch {
    return false;
  }
}
