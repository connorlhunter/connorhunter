import type { ArtifactLink } from "@/content/schema";

export const projectResourceKinds = [
  "overview",
  "docs",
  "diagrams",
  "coverage",
  "changelog",
] as const;

export type ProjectResourceKind = (typeof projectResourceKinds)[number];

/** Builds a stable route for an inset project resource. */
export function projectResourceHref(
  slug: string,
  resource: ProjectResourceKind = "overview",
  itemId?: string,
): string {
  const base = `/projects/${slug}`;
  if (resource === "overview") return base;
  if (resource === "docs")
    return itemId ? `${base}/docs/${encodeURIComponent(itemId)}` : `${base}/docs`;
  if (resource === "diagrams") {
    return itemId ? `${base}/diagrams/${encodeURIComponent(itemId)}` : `${base}/diagrams`;
  }
  if (resource === "changelog") return `${base}/changelog`;
  return `${base}/coverage`;
}

/** Resolves the active resource from a project's nested route pathname. */
export function projectResourceFromPathname(pathname: string, slug: string): ProjectResourceKind {
  const nestedPath = pathname.startsWith(`/projects/${slug}/`)
    ? pathname.slice(`/projects/${slug}/`.length)
    : "";
  if (nestedPath === "docs" || nestedPath.startsWith("docs/")) return "docs";
  if (nestedPath === "diagrams" || nestedPath.startsWith("diagrams/")) return "diagrams";
  if (nestedPath === "coverage") return "coverage";
  if (nestedPath === "changelog") return "changelog";
  return "overview";
}

/** Maps a published resource label to its presentation route. */
export function projectResourceForArtifact(label: ArtifactLink["label"]): ProjectResourceKind {
  if (label === "Docs") return "docs";
  if (label === "Diagrams") return "diagrams";
  if (label === "Coverage") return "coverage";
  return "changelog";
}
