import type { Resource, Stage } from "@/lib/types";

/**
 * Resource counting after the topic restructure.
 *
 * Links now live in two places — on the stage (whole-stage course and
 * certification picks) and on each topic. Anything that counts or lists
 * "resources" for a stage must look at both, or it reports a fraction of what
 * is actually there. This is the single place that knows that, so a future
 * schema change has one call site to fix rather than eight.
 */

/** Every link on a stage, stage-level first, then per topic. */
export function stageResources(stage: Stage): Resource[] {
  return [...stage.resources, ...stage.topics.flatMap((t) => t.resources)];
}

/**
 * How many distinct links a stage points at.
 *
 * Deduped by URL: the sheet legitimately cites one page from several topics
 * (both "Tokens" and "Temperature & Output Control" send you to the OpenAI
 * prompt guide), and counting that page twice would overstate the total.
 */
export function countStageResources(stage: Stage): number {
  return new Set(stageResources(stage).map((r) => r.url)).size;
}

/** Distinct links across a whole path or the shared foundation. */
export function countResources(stages: Stage[]): number {
  const urls = new Set<string>();
  for (const stage of stages) {
    for (const resource of stageResources(stage)) urls.add(resource.url);
  }
  return urls.size;
}
