import type { ArtifactLink } from "@/content/schema";
import { artifactViewerKind, projectDetailViewerHref } from "./project-viewer-model";

export type ArtifactActionSurface = "external" | "projects-page";

interface ArtifactActionTarget {
  readonly href: string;
  readonly target?: "_blank";
}

/**
 * @param artifact - Artifact link from project content.
 * @param projectSlug - Optional project slug for in-app viewer links.
 * @param surface - Viewer surface or external fallback.
 * @returns The href and target for an artifact action.
 */
export function artifactActionTarget(
  artifact: ArtifactLink,
  projectSlug: string | undefined,
  surface: ArtifactActionSurface,
): ArtifactActionTarget {
  if (!projectSlug || surface === "external") {
    return { href: artifact.href, target: "_blank" };
  }

  const viewer = artifactViewerKind(artifact.label);

  return { href: projectDetailViewerHref(projectSlug, viewer) };
}
