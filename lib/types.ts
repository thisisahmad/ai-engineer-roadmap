import type { AccentName } from "@/lib/accents";

/**
 * Types for everything under /content.
 *
 * The JSON files are the source of truth. `lib/content.ts` validates against
 * these shapes at build time, so a malformed file fails `next build` rather
 * than rendering a broken page.
 */

/** Where a link came from. Rendered as provenance on every resource. */
export type ResourceSource = "team-lead" | "curated";

export type Resource = {
  label: string;
  url: string;
  /**
   * "team-lead" — from the original Google Sheet (Raw-Sheet-Content doc).
   * "curated"   — from the v2 content doc.
   * A stage usually carries both; neither set is dropped in the merge.
   */
  source: ResourceSource;
  /** Caveats worth showing inline, e.g. "certificate requires a Pro membership". */
  note?: string;
};

/**
 * The four rungs used for grouping and colour.
 *
 * The source doc also uses transitional labels ("Junior → Mid") and "Any" for
 * certification checkpoints, which this union cannot express. `Stage.levelLabel`
 * carries the source string verbatim; `level` is the canonical value.
 */
export type Level = "junior" | "mid" | "senior" | "architect";

/** Distinguishes the two special stages every path ends with. */
export type StageKind = "certification" | "architect";

export type Stage = {
  id: string;
  /** 1-based position within the path. */
  order: number;
  title: string;
  level: Level;
  /** Verbatim from the source doc: "Junior", "Junior → Mid", "Senior+", "Any level". */
  levelLabel: string;
  /** The "What to Cover" column from the v2 doc. */
  description: string;
  /** Topic names, merged from the v2 doc and the matching sheet tab. */
  topics: string[];
  /** Curated links first, then team-lead links. Empty only where flagged below. */
  resources: Resource[];
  /**
   * True where the source sheet had no links and no external course covers the
   * material — these sections are to be written as original content rather than
   * linked out. Currently only Agentic AI Engineer, stage 5.
   */
  needsOriginalContent?: boolean;
  kind?: StageKind;
  /** Slugs of paths this stage is shared with, per the v2 doc. */
  sharedWith?: string[];
  note?: string;
};

/** The role-differentiation row from Section 1 of the v2 doc. */
export type RoleSummary = {
  whatTheyDo: string;
  /** "Yes" | "No" | "Sometimes (LoRA/QLoRA)" — kept as prose, as in the source. */
  trainsModels: string;
  coreFocus: string;
};

export type Path = {
  slug: string;
  title: string;
  /** Compact label for nav and cards. */
  shortTitle: string;
  /** The v2 doc's path letter (A-G), kept so the docs stay cross-referencable. */
  pathLetter: string;
  order: number;
  accent: AccentName;
  tagline: string;
  role: RoleSummary;
  /** Every path assumes the shared foundation in content/foundation.json. */
  requiresFoundation: boolean;
  prerequisite?: string;
  prerequisitePathSlug?: string;
  /** Marks the Agentic AI Engineer path as the flagship. */
  flagship?: boolean;
  note?: string;
  stages: Stage[];
};

/** content/foundation.json — Stage 0, shared by all seven paths. */
export type Foundation = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  stages: Stage[];
};

/** content/career-ladder.json */
export type LadderLevel = {
  id: string;
  level: Level;
  title: string;
  yearsExperience: string;
  focus: string;
  scope: string;
  guidance: string;
  /** What changes at this level — drawn from Section 2 of the v2 doc. */
  responsibilities: string[];
  /**
   * What separates this rung from the one below.
   *
   * The source doc does not carry this as a field; it is derived from the
   * deltas between consecutive rungs. Edit freely — nothing else depends on
   * the wording.
   */
  separators: string[];
  /** Only on the first rung, which has no rung below it to differ from. */
  entryNote?: string;
};

export type CareerLadder = {
  title: string;
  intro: string;
  closing: string;
  levels: LadderLevel[];
};

/** content/resources.json */
export type ResourceGroup = {
  id: string;
  title: string;
  description?: string;
  resources: Resource[];
};

export type ResourceLibrary = {
  intro: string;
  caveat: string;
  groups: ResourceGroup[];
};

/** content/certifications.json */
export type Certification = {
  id: string;
  name: string;
  provider: string;
  url: string;
  cost: string;
  note?: string;
  /** Path slugs whose certification checkpoint recommends this one. */
  appearsInPaths: string[];
};

export type CertificationLibrary = {
  intro: string;
  caveat: string;
  items: Certification[];
};

/** content/projects.json — Tab 12 of the sheet, tagged by path. */
export type Project = {
  id: string;
  title: string;
  /** Path slugs, plus "foundation" for pre-path projects. */
  paths: string[];
  resources: Resource[];
};

export type ProjectLibrary = {
  intro: string;
  items: Project[];
};
