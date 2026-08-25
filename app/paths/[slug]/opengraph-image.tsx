import { ImageResponse } from "next/og";

import { getAllPathSlugs, getPath } from "@/lib/content";

/**
 * Per-path Open Graph card, generated at build time.
 *
 * Under `output: "export"` these are rendered during `next build` and written
 * to disk as real PNGs, so there is no runtime image service and nothing to
 * pay for. That also means the design is fixed at build time — change this
 * file and rebuild to see it.
 *
 * Only fonts that exist in the build environment can be used, and no external
 * asset can be fetched, so this is deliberately typography and colour only.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI engineering career roadmap";

/** One image per path file, matching the page beside it. */
export function generateStaticParams() {
  return getAllPathSlugs().map((slug) => ({ slug }));
}

/** Accent hex per path, mirroring lib/accents but as raw colour for satori. */
const ACCENT: Record<string, string> = {
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  teal: "#14b8a6",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = getPath(slug);

  if (!path) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#08080c",
            color: "#fafafa",
            fontSize: 64,
          }}
        >
          AI Roadmap
        </div>
      ),
      size,
    );
  }

  const color = ACCENT[path.accent] ?? "#8b5cf6";
  const stageCount = path.stages.length;
  const resourceCount = path.stages.reduce(
    (total, stage) => total + stage.resources.length,
    0,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080c",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Accent wash. satori has no filters or radial gradients, so depth
            comes from a linear gradient bar rather than a blur. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            display: "flex",
            background: `linear-gradient(90deg, ${color}, #fbbf24)`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 999,
                background: color,
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#a1a1aa",
                letterSpacing: 1,
              }}
            >
              {`AI ROADMAP · PATH ${path.pathLetter}`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 78,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 960,
            }}
          >
            {path.title}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 32,
              color: "#a1a1aa",
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            {path.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color }}>
                {stageCount}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>stages</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color }}>
                {resourceCount}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>resources</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#fbbf24" }}>
                Junior → Architect
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>progression</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
