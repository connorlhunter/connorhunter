import type { ArtifactLink } from "@/content/schema";

export const projectViewerKinds = ["project", "docs", "diagrams", "coverage"] as const;

export type ProjectViewerKind = (typeof projectViewerKinds)[number];

/**
 * @param value - Unknown search param value.
 * @returns A valid project viewer kind, or undefined.
 */
export function parseProjectViewerKind(value: unknown): ProjectViewerKind | undefined {
  return typeof value === "string" && projectViewerKinds.includes(value as ProjectViewerKind)
    ? (value as ProjectViewerKind)
    : undefined;
}

/**
 * @param label - Artifact label from project content.
 * @returns The viewer kind for that artifact.
 */
export function artifactViewerKind(
  label: ArtifactLink["label"],
): Exclude<ProjectViewerKind, "project"> {
  if (label === "Docs") {
    return "docs";
  }

  if (label === "Coverage") {
    return "coverage";
  }

  return "diagrams";
}

/**
 * @param viewer - Project viewer kind.
 * @returns Viewer label.
 */
export function projectViewerLabel(viewer: ProjectViewerKind): string {
  if (viewer === "docs") return "Docs";
  if (viewer === "diagrams") return "Diagrams";
  if (viewer === "coverage") return "Coverage";

  return "Project";
}

/**
 * @param slug - Project slug.
 * @param viewer - Viewer kind to open on the detail route.
 * @returns Project detail route URL with viewer state.
 */
export function projectDetailViewerHref(
  slug: string,
  viewer: ProjectViewerKind = "project",
  options: { readonly diagram?: string } = {},
): string {
  const params = new URLSearchParams();

  if (viewer !== "project") {
    params.set("viewer", viewer);
  }

  if (viewer === "diagrams" && options.diagram) {
    params.set("diagram", options.diagram);
  }

  const search = params.toString();

  return `/projects/${slug}${search ? `?${search}` : ""}#project-viewer`;
}

/**
 * @param slug - Project slug.
 * @returns Projects route URL with selected project scroll state.
 */
export function projectsPageViewerHref(slug: string): string {
  const params = new URLSearchParams({ project: slug });

  return `/projects?${params.toString()}#${slug}`;
}
