import { z } from "zod";
import type { ArtifactLink } from "@/content/schema";
import { artifactUrl } from "@/config/public-env";
import { resolveContentHref } from "@/content/hrefs";
import { readArtifactJson } from "./source";

const projectArtifactEntrySchema = z.object({
  coverageComingSoon: z.boolean().optional(),
  coveragePages: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        path: z.string().min(1),
        pdfPath: z.string().min(1).optional(),
      }),
    )
    .optional(),
  coveragePath: z.string().min(1),
  coveragePdfPath: z.string().min(1).optional(),
  diagramPaths: z.array(z.string().min(1)).optional(),
  docsPdfPath: z.string().min(1).optional(),
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

interface DiagramPathMetadata {
  readonly id: string;
  readonly label: string;
  readonly lastUpdated?: string | undefined;
  readonly version?: string | undefined;
}

interface VersionedDiagramMetadata {
  readonly lastUpdated: string;
  readonly title: string;
  readonly version: string;
}

const versionedDiagramStemPattern =
  /^(.+)-v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))-(\d{4}-\d{2}-\d{2})$/u;

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
 * @param value - Diagram stem value to normalize.
 * @returns A stable route-safe diagram id.
 */
function diagramId(value: string): string {
  return value.replace(/[^a-z0-9-]+/giu, "-").replace(/^-+|-+$/gu, "");
}

/**
 * @param value - Diagram title stem to make readable.
 * @returns A title-cased diagram label.
 */
function diagramLabel(value: string): string {
  return diagramId(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * @param stem - Project-relative diagram file stem.
 * @returns Parsed metadata when the stem uses a valid published filename.
 */
function versionedDiagramMetadata(stem: string): VersionedDiagramMetadata | undefined {
  const match = versionedDiagramStemPattern.exec(stem);

  if (!match) {
    return undefined;
  }

  const title = match[1] as string;
  const version = match[2] as string;
  const lastUpdated = match[3] as string;

  if (!z.iso.date().safeParse(lastUpdated).success) {
    return undefined;
  }

  return { lastUpdated, title, version };
}

/**
 * @param path - Diagram artifact path.
 * @returns Route, title, and optional version metadata parsed from the file name.
 */
function diagramPathMetadata(path: string): DiagramPathMetadata {
  const { folder, stem } = diagramPathParts(path);
  const projectPrefix = `${folder}-`;
  const compactStem =
    folder && stem.startsWith(projectPrefix) ? stem.slice(projectPrefix.length) : stem;
  const metadata = versionedDiagramMetadata(compactStem);

  return {
    id: diagramId(compactStem),
    label: diagramLabel(metadata?.title ?? compactStem),
    ...(metadata ? { lastUpdated: metadata.lastUpdated, version: metadata.version } : {}),
  };
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
      ...(entry.docsPdfPath ? { downloadHref: artifactUrl(entry.docsPdfPath) } : {}),
    },
    {
      label: "Coverage",
      href: entry.coveragePages?.[0]
        ? artifactUrl(entry.coveragePages[0].path)
        : resolveArtifactAlias(entry, "coverage"),
      comingSoon: entry.coverageComingSoon,
      ...(entry.coveragePages?.[0]?.pdfPath
        ? { downloadHref: artifactUrl(entry.coveragePages[0].pdfPath) }
        : entry.coveragePdfPath
          ? { downloadHref: artifactUrl(entry.coveragePdfPath) }
          : {}),
      ...(entry.coveragePages?.length
        ? {
            items: entry.coveragePages.map((page) => ({
              href: artifactUrl(page.path),
              id: page.id,
              label: page.label,
              ...(page.pdfPath ? { downloadHref: artifactUrl(page.pdfPath) } : {}),
            })),
          }
        : {}),
    },
    {
      label: "Diagrams",
      href: resolveArtifactAlias(entry, "overview-diagram"),
      items: diagramPaths(entry).map((path) => ({
        href: artifactUrl(path),
        ...diagramPathMetadata(path),
      })),
    },
  ];
}
