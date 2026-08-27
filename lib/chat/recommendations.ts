import "server-only";

import { z } from "zod";

import type { Recommendation } from "@/lib/chat/types";
import {
  getAllPaths,
  getCertifications,
  getFoundation,
  getResourceLibrary,
} from "@/lib/content";

/**
 * Recommendation blocks the model emits, and the validation that decides
 * whether one is real enough to render.
 *
 * Blocks are extracted and checked on the SERVER before anything reaches the
 * browser. Doing it here rather than in the client means the validation has
 * the actual content to check against without shipping every slug and URL to
 * the page, an invalid recommendation is dropped before it can be rendered,
 * and no raw JSON flashes on screen while a block is still streaming in.
 */

/** What the model is told to write. */
export const RECOMMEND_FENCE = "```recommend";

const pathBlock = z.object({
  type: z.literal("path"),
  slug: z.string(),
  reason: z.string().max(300).optional(),
});

const resourceBlock = z.object({
  type: z.literal("resource"),
  title: z.string(),
  url: z.string(),
  reason: z.string().max(300).optional(),
});

const blockSchema = z.union([pathBlock, resourceBlock]);

/**
 * Every URL that appears anywhere on the site.
 *
 * Slugs are not the only thing worth checking. A model that invents a URL
 * would otherwise produce a card linking somewhere nobody vetted, which is a
 * worse failure than a broken path card — so resources are validated against
 * the real set too, and the title is taken from the content rather than from
 * whatever the model wrote.
 */
let urlIndex: Map<string, string> | null = null;

function knownResources(): Map<string, string> {
  if (urlIndex) return urlIndex;

  const index = new Map<string, string>();
  const add = (label: string, url: string) => {
    if (!index.has(url)) index.set(url, label);
  };

  for (const doc of [...getAllPaths(), getFoundation()]) {
    for (const stage of doc.stages) {
      for (const resource of stage.resources) add(resource.label, resource.url);
      for (const topic of stage.topics) {
        for (const resource of topic.resources) add(resource.label, resource.url);
      }
    }
  }

  for (const resource of getResourceLibrary().items) {
    add(resource.label, resource.url);
  }

  for (const item of getCertifications().items) add(item.name, item.url);

  urlIndex = index;
  return index;
}

/** Trailing-slash and protocol differences should not fail a real match. */
function normaliseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

let normalisedIndex: Map<string, { label: string; url: string }> | null = null;

function normalisedResources() {
  if (normalisedIndex) return normalisedIndex;
  const index = new Map<string, { label: string; url: string }>();
  for (const [url, label] of knownResources()) {
    index.set(normaliseUrl(url), { label, url });
  }
  normalisedIndex = index;
  return index;
}

/**
 * Turns one raw block into something renderable, or null if it does not
 * correspond to real content.
 *
 * A null return is always logged: it means the model ignored the grounding
 * data it was given, which is worth knowing about even though the visitor
 * simply sees a reply without a card.
 */
export function validateBlock(raw: string): Recommendation | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn("[chat] recommendation block was not valid JSON:", raw.slice(0, 200));
    return null;
  }

  const result = blockSchema.safeParse(parsed);
  if (!result.success) {
    console.warn(
      "[chat] recommendation block did not match the schema:",
      raw.slice(0, 200),
    );
    return null;
  }

  const block = result.data;

  if (block.type === "path") {
    const path = getAllPaths().find((p) => p.slug === block.slug);
    if (!path) {
      console.warn(
        `[chat] model recommended path "${block.slug}", which does not exist. Dropped.`,
      );
      return null;
    }

    return {
      type: "path",
      slug: path.slug,
      title: path.title,
      tagline: path.tagline,
      accent: path.accent,
      stageCount: path.stages.length,
      reason: block.reason,
    };
  }

  const match = normalisedResources().get(normaliseUrl(block.url));
  if (!match) {
    console.warn(
      `[chat] model recommended resource "${block.url}", which is not on the site. Dropped.`,
    );
    return null;
  }

  return {
    // Title comes from the content, not from the model, so a real URL cannot
    // be paired with a misleading label.
    type: "resource",
    title: match.label,
    url: match.url,
    reason: block.reason,
  };
}

/**
 * Pulls complete recommendation blocks out of a growing buffer.
 *
 * Returns the text safe to emit now, the recommendations found, and whatever
 * must stay buffered. Text is held back in two cases: an opened block that has
 * not closed yet, and a tail that could be the start of a fence — without the
 * second, "``" would be emitted as prose a moment before "`recommend" arrived.
 */
export function drainBuffer(buffer: string): {
  text: string;
  recommendations: Recommendation[];
  rest: string;
} {
  let text = "";
  const recommendations: Recommendation[] = [];
  let rest = buffer;

  for (;;) {
    const start = rest.indexOf(RECOMMEND_FENCE);

    if (start === -1) {
      // Keep back enough characters that a fence split across deltas is not
      // emitted as prose.
      const keep = Math.max(0, rest.length - (RECOMMEND_FENCE.length - 1));
      text += rest.slice(0, keep);
      rest = rest.slice(keep);
      break;
    }

    text += rest.slice(0, start);
    const afterFence = start + RECOMMEND_FENCE.length;
    const end = rest.indexOf("```", afterFence);

    if (end === -1) {
      // Block is still arriving. Hold everything from the fence onwards.
      rest = rest.slice(start);
      break;
    }

    const recommendation = validateBlock(rest.slice(afterFence, end).trim());
    if (recommendation) recommendations.push(recommendation);

    rest = rest.slice(end + 3);
  }

  return { text, recommendations, rest };
}

/**
 * Final flush. An unterminated block at the end of a stream is malformed, so
 * it is dropped rather than shown to the visitor as raw JSON.
 */
export function flushBuffer(buffer: string): string {
  if (!buffer.includes(RECOMMEND_FENCE)) return buffer;

  console.warn("[chat] stream ended inside a recommendation block. Dropped.");
  return buffer.slice(0, buffer.indexOf(RECOMMEND_FENCE));
}
