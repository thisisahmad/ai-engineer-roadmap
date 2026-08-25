import "server-only";

import fs from "node:fs";
import path from "node:path";

import type {
  CareerLadder,
  CertificationLibrary,
  Foundation,
  Path,
  Faq,
  ProjectLibrary,
  Resource,
  ResourceLibrary,
  Stage,
} from "@/lib/types";

/**
 * Every read here happens during `next build`, never at request time — the
 * pages that call these functions are all statically generated. Results are
 * memoised for the lifetime of the build.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");
const PATHS_DIR = path.join(CONTENT_DIR, "paths");

function readJson<T>(...segments: string[]): T {
  const file = path.join(CONTENT_DIR, ...segments);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch (cause) {
    throw new Error(`Could not read content/${segments.join("/")}`, { cause });
  }
}

const LEVELS = new Set(["junior", "mid", "senior", "architect"]);
const SOURCES = new Set(["team-lead", "curated"]);

/**
 * Collapses resources that point at the same URL.
 *
 * The JSON deliberately keeps one entry per source, so a link the team sheet
 * and the curated research both landed on appears twice — that provenance is
 * worth preserving in the files. The UI does not render `source`, though, so
 * at runtime those two entries are one link and would otherwise render as a
 * visually identical duplicate row.
 *
 * First occurrence wins, and `merge()` orders curated ahead of team-lead, so
 * the curated label and its note survive. Deduping here rather than in the
 * component keeps the counts shown on cards in step with the list beneath.
 */
function dedupeResources(stage: Stage): Stage {
  const byUrl = new Map<string, Resource>();

  for (const resource of stage.resources) {
    const existing = byUrl.get(resource.url);

    if (!existing) {
      byUrl.set(resource.url, resource);
      continue;
    }
    // Keep the surviving entry, but do not lose a note the loser carried.
    if (!existing.note && resource.note) {
      byUrl.set(resource.url, { ...existing, note: resource.note });
    }
  }

  return byUrl.size === stage.resources.length
    ? stage
    : { ...stage, resources: [...byUrl.values()] };
}

/** Fails the build loudly rather than rendering a half-empty page. */
function assertStages(stages: Stage[], where: string) {
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error(`${where} has no stages.`);
  }

  for (const stage of stages) {
    if (!stage.id || !stage.title) {
      throw new Error(`${where} has a stage missing id or title.`);
    }
    if (!LEVELS.has(stage.level)) {
      throw new Error(
        `${where} stage "${stage.id}" has invalid level "${stage.level}".`,
      );
    }
    // A stage with no links is only legitimate when it is flagged for original
    // content or is the shared architect stage — otherwise a link set was lost.
    if (
      stage.resources.length === 0 &&
      !stage.needsOriginalContent &&
      stage.kind !== "architect"
    ) {
      throw new Error(
        `${where} stage "${stage.id}" has no resources and is not flagged needsOriginalContent.`,
      );
    }
    for (const resource of stage.resources) {
      if (!SOURCES.has(resource.source)) {
        throw new Error(
          `${where} stage "${stage.id}" has a resource with invalid source "${resource.source}".`,
        );
      }
    }
  }
}

let pathCache: Path[] | null = null;

function loadPaths(): Path[] {
  if (pathCache) return pathCache;

  const files = fs
    .readdirSync(PATHS_DIR)
    .filter((file) => file.endsWith(".json"));

  const docs = files.map((file) => {
    const doc = readJson<Path>("paths", file);
    const slug = file.replace(/\.json$/, "");

    if (doc.slug !== slug) {
      throw new Error(
        `content/paths/${file} declares slug "${doc.slug}" — it must match the filename.`,
      );
    }
    assertStages(doc.stages, `content/paths/${file}`);

    return { ...doc, stages: doc.stages.map(dedupeResources) };
  });

  pathCache = docs.sort((a, b) => a.order - b.order);
  return pathCache;
}

/** All seven paths, ordered by `order`. */
export function getAllPaths(): Path[] {
  return loadPaths();
}

/** Card-level data — everything except the stage list. */
export function getPathSummaries(): Omit<Path, "stages">[] {
  return loadPaths().map(({ stages: _stages, ...rest }) => rest);
}

export function getPath(slug: string): Path | null {
  return loadPaths().find((doc) => doc.slug === slug) ?? null;
}

/** Feeds `generateStaticParams` in app/paths/[slug]/page.tsx. */
export function getAllPathSlugs(): string[] {
  return loadPaths().map((doc) => doc.slug);
}

let foundationCache: Foundation | null = null;

/** Stage 0 — shared by all seven paths, so it lives in one file. */
export function getFoundation(): Foundation {
  if (!foundationCache) {
    const doc = readJson<Foundation>("foundation.json");
    assertStages(doc.stages, "content/foundation.json");
    foundationCache = { ...doc, stages: doc.stages.map(dedupeResources) };
  }
  return foundationCache;
}

export function getCareerLadder(): CareerLadder {
  return readJson<CareerLadder>("career-ladder.json");
}

export function getResourceLibrary(): ResourceLibrary {
  return readJson<ResourceLibrary>("resources.json");
}

export function getCertifications(): CertificationLibrary {
  return readJson<CertificationLibrary>("certifications.json");
}

export function getFaq(): Faq {
  return readJson<Faq>("faq.json");
}

export function getProjects(): ProjectLibrary {
  return readJson<ProjectLibrary>("projects.json");
}

/** Projects tagged for one path, in file order. */
export function getProjectsForPath(slug: string) {
  return getProjects().items.filter((project) => project.paths.includes(slug));
}
