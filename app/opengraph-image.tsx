import { ImageResponse } from "next/og";

import { getAllPaths, getFoundation } from "@/lib/content";

/**
 * Site-level Open Graph card, used by every route that does not define its
 * own. Generated at build time, same as the per-path cards.
 *
 * satori requires an explicit `display` on any element with more than one
 * child, and counts a literal string sitting next to an interpolation as two.
 * Every div below carries one rather than relying on remembering which need it.
 */
/**
 * Metadata routes compile to Route Handlers, which are dynamic by default.
 * The per-path image gets its static-ness implicitly from generateStaticParams;
 * this one has no params, so it has to say so explicitly or the export fails.
 */
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI Roadmap — seven routes into AI engineering";

export default async function Image() {
  const paths = getAllPaths();
  const foundation = getFoundation();

  const stageTotal =
    paths.reduce((n, p) => n + p.stages.length, 0) + foundation.stages.length;
  const resourceTotal =
    paths.reduce(
      (n, p) => n + p.stages.reduce((m, s) => m + s.resources.length, 0),
      0,
    ) + foundation.stages.reduce((m, s) => m + s.resources.length, 0);

  const stats = [
    { value: `${paths.length}`, label: "career paths" },
    { value: `${stageTotal}`, label: "stages" },
    { value: `${resourceTotal}`, label: "resources" },
  ];

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
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            display: "flex",
            background: "linear-gradient(90deg, #8b5cf6, #fbbf24)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#a1a1aa",
              letterSpacing: 2,
            }}
          >
            AI ROADMAP
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 84,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Seven routes into AI engineering.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 32,
              color: "#a1a1aa",
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Stage by stage, junior to architect, with free resources at
            every step.
          </div>
        </div>

        <div style={{ display: "flex", gap: 56 }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#a78bfa",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{ display: "flex", fontSize: 22, color: "#71717a" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
