import { z } from "zod";
import type { ArtifactLink } from "@/content/schema";
import { artifactUrl } from "@/config/public-env";
import { resolveContentHref } from "@/content/hrefs";
import { readArtifactJson } from "./source";

const artifactFileSchema = z.object({
  indexPath: z.string().min(1),
  pdfPath: z.string().min(1),
});

const markdownArtifactFileSchema = z.object({
  markdownPath: z.string().min(1),
  pdfPath: z.string().min(1),
});

const diagramSchema = z.object({
  id: z.string().min(1),
  lastUpdated: z.iso.date(),
  overview: z.boolean().optional(),
  svgPath: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
});

const projectArtifactEntrySchema = z.object({
  changelog: markdownArtifactFileSchema,
  coverage: artifactFileSchema.extend({ comingSoon: z.boolean().optional() }),
  diagrams: z.array(diagramSchema).min(1),
  docs: artifactFileSchema,
  iconPath: z.string().min(1),
});

const projectArtifactManifestSchema = z.object({
  projects: z.record(z.string().min(1), projectArtifactEntrySchema),
  schemaVersion: z.literal(2),
});

/** Public artifact metadata for a single project. */
export type ProjectArtifactEntry = z.infer<typeof projectArtifactEntrySchema>;

/** Published artifact manifest keyed by project slug. */
export type ProjectArtifactManifest = z.infer<typeof projectArtifactManifestSchema>;

type ArtifactAlias = "changelog" | "coverage" | "docs" | "overview-diagram";

/** Loads and validates the shared project artifact manifest. */
export async function loadProjectArtifactManifest(path: string): Promise<ProjectArtifactManifest> {
  return projectArtifactManifestSchema.parse(await readArtifactJson(path));
}

/** Resolves one project artifact record by slug. */
export function projectArtifactEntry(
  manifest: ProjectArtifactManifest,
  slug: string,
): ProjectArtifactEntry {
  const entry = manifest.projects[slug];
  if (!entry) throw new Error(`Missing artifact manifest entry for project: ${slug}`);
  return entry;
}

/** Resolves a project icon source from the artifact-aware content token. */
export function projectIconHref(entry: ProjectArtifactEntry): string {
  return resolveContentHref(entry.iconPath);
}

/** Resolves an artifact path used by compact project-card fallbacks. */
export function resolveArtifactAlias(entry: ProjectArtifactEntry, alias: string): string {
  if (alias === "docs") return artifactUrl(entry.docs.indexPath);
  if (alias === "coverage") return artifactUrl(entry.coverage.indexPath);
  if (alias === "changelog") return artifactUrl(entry.changelog.markdownPath);
  if (alias === "overview-diagram") return artifactUrl(overviewDiagram(entry).svgPath);
  throw new Error(`Unsupported artifact alias "${alias as ArtifactAlias}".`);
}

/** Creates UI-ready resource links without treating generated artifacts as pages. */
export function projectArtifactLinks(entry: ProjectArtifactEntry): Array<ArtifactLink> {
  const overview = overviewDiagram(entry);
  return [
    {
      downloadHref: artifactUrl(entry.docs.pdfPath),
      href: artifactUrl(entry.docs.indexPath),
      label: "Docs",
    },
    {
      comingSoon: entry.coverage.comingSoon,
      downloadHref: artifactUrl(entry.coverage.pdfPath),
      href: artifactUrl(entry.coverage.indexPath),
      label: "Coverage",
    },
    {
      href: artifactUrl(overview.svgPath),
      items: entry.diagrams.map((diagram) => ({
        href: artifactUrl(diagram.svgPath),
        id: diagram.id,
        label: diagram.title,
        lastUpdated: diagram.lastUpdated,
        version: diagram.version,
      })),
      label: "Diagrams",
    },
    {
      downloadHref: artifactUrl(entry.changelog.pdfPath),
      href: artifactUrl(entry.changelog.markdownPath),
      label: "Changelog",
    },
  ];
}

function overviewDiagram(entry: ProjectArtifactEntry): z.infer<typeof diagramSchema> {
  return entry.diagrams.find((diagram) => diagram.overview) ?? entry.diagrams[0]!;
}
