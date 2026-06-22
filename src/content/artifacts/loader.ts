import { z } from "zod";
import type { ArtifactLink } from "@/content/schema";
import { artifactUrl } from "@/config/public-env";
import { resolveContentHref } from "@/content/hrefs";
import { readArtifactJson } from "./source";

const projectArtifactEntrySchema = z.object({
  coverageComingSoon: z.boolean().optional(),
  coveragePath: z.string().min(1),
  diagramPaths: z.array(z.string().min(1)).optional(),
  docsPath: z.string().min(1),
  iconPath: z.string().min(1),
  markdownPath: z.string().min(1),
  overviewDiagramPath: z.string().min(1),
});

const projectArtifactManifestSchema = z.object({
  projects: z.record(z.string().min(1), projectArtifactEntrySchema),
});

/**
 * @description Artifact paths for one project entry in the shared manifest.
 */
export type ProjectArtifactEntry = z.infer<typeof projectArtifactEntrySchema>;

/**
 * @description Shared artifact manifest keyed by project slug.
 */
export type ProjectArtifactManifest = z.infer<typeof projectArtifactManifestSchema>;

type ArtifactAlias = "coverage" | "docs" | "overview-diagram";

/**
 * @param path - Diagram artifact path.
 * @returns The containing project folder and file stem for that diagram.
 */
function diagramPathParts(path: string): { readonly folder: string; readonly stem: string } {
  const segments = path.split("/");
  const filename = segments.at(-1) ?? path;
  const folder = segments.at(-2) ?? "";
  const stem = filename.replace(/\.[^.]+$/u, "");

  return { folder, stem };
}

/**
 * @param path - Diagram artifact path.
 * @returns A stable diagram id derived from the file name.
 */
function diagramId(path: string): string {
  const { folder, stem } = diagramPathParts(path);
  const projectPrefix = `${folder}-`;
  const compactStem =
    folder && stem.startsWith(projectPrefix) ? stem.slice(projectPrefix.length) : stem;

  return compactStem.replace(/[^a-z0-9-]+/giu, "-").replace(/^-+|-+$/gu, "");
}

/**
 * @param path - Diagram artifact path.
 * @returns A readable diagram label derived from the file name.
 */
function diagramLabel(path: string): string {
  return diagramId(path)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * @param entry - Project artifact manifest entry.
 * @returns Ordered diagram paths, defaulting to the overview diagram.
 */
function diagramPaths(entry: ProjectArtifactEntry): ReadonlyArray<string> {
  const paths = entry.diagramPaths ?? [entry.overviewDiagramPath];

  return paths.includes(entry.overviewDiagramPath) ? paths : [entry.overviewDiagramPath, ...paths];
}

/**
 * @param path - Manifest path inside the configured artifact source.
 * @returns The parsed project artifact manifest.
 */
export async function loadProjectArtifactManifest(path: string): Promise<ProjectArtifactManifest> {
  return projectArtifactManifestSchema.parse(await readArtifactJson(path));
}

/**
 * @param manifest - Parsed project artifact manifest.
 * @param slug - Project slug to resolve.
 * @returns The artifact entry for the requested project.
 */
export function projectArtifactEntry(
  manifest: ProjectArtifactManifest,
  slug: string,
): ProjectArtifactEntry {
  const entry = manifest.projects[slug];

  if (!entry) {
    throw new Error(`Missing artifact manifest entry for project: ${slug}`);
  }

  return entry;
}

/**
 * @param entry - Project artifact manifest entry.
 * @returns The public icon href for the project.
 */
export function projectIconHref(entry: ProjectArtifactEntry): string {
  return resolveContentHref(entry.iconPath);
}

/**
 * @param entry - Project artifact manifest entry.
 * @param alias - Supported artifact alias from project markdown.
 * @returns The public artifact href for the alias.
 */
export function resolveArtifactAlias(entry: ProjectArtifactEntry, alias: string): string {
  const artifactAlias = alias as ArtifactAlias;

  if (artifactAlias === "docs") {
    return artifactUrl(entry.docsPath);
  }

  if (artifactAlias === "coverage") {
    return artifactUrl(entry.coveragePath);
  }

  if (artifactAlias === "overview-diagram") {
    return artifactUrl(entry.overviewDiagramPath);
  }

  throw new Error(`Unsupported artifact alias "${alias}".`);
}

/**
 * @param entry - Project artifact manifest entry.
 * @returns UI-ready docs, coverage, and overview diagram links.
 */
export function projectArtifactLinks(entry: ProjectArtifactEntry): Array<ArtifactLink> {
  return [
    {
      label: "Docs",
      href: resolveArtifactAlias(entry, "docs"),
    },
    {
      label: "Coverage",
      href: resolveArtifactAlias(entry, "coverage"),
      comingSoon: entry.coverageComingSoon,
    },
    {
      label: "Diagrams",
      href: resolveArtifactAlias(entry, "overview-diagram"),
      items: diagramPaths(entry).map((path) => ({
        href: artifactUrl(path),
        id: diagramId(path),
        label: diagramLabel(path),
      })),
    },
  ];
}
