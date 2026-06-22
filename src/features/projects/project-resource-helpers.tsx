import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ArtifactItem, ArtifactLink, Project } from "@/content/schema";
import { navigateInPlace, type FileViewerAction } from "@/features/viewer/file-viewer";
import {
  artifactViewerKind,
  projectDetailViewerHref,
  type ProjectViewerKind,
} from "./project-viewer-model";

/**
 * @param project - Project content.
 * @param viewer - Viewer kind.
 * @returns The artifact matching the requested viewer.
 */
export function artifactForViewer(
  project: Project,
  viewer: ProjectViewerKind,
): ArtifactLink | undefined {
  if (viewer === "project") {
    return undefined;
  }

  return project.artifacts.find((artifact) => artifactViewerKind(artifact.label) === viewer);
}

/**
 * @param artifact - Diagrams artifact link.
 * @returns The diagram items available for the viewer.
 */
export function diagramItems(artifact: ArtifactLink | undefined): ReadonlyArray<ArtifactItem> {
  if (!artifact) {
    return [];
  }

  return artifact.items?.length
    ? artifact.items
    : [{ href: artifact.href, id: "overview", label: "Overview" }];
}

/**
 * @param items - Available diagram items.
 * @param selectedDiagramId - Optional selected diagram id from the route.
 * @returns The selected diagram item, defaulting to the first available diagram.
 */
export function selectedDiagramItem(
  items: ReadonlyArray<ArtifactItem>,
  selectedDiagramId: string | undefined,
): ArtifactItem | undefined {
  return items.find((item) => item.id === selectedDiagramId) ?? items[0];
}

/**
 * @param project - Project slug source.
 * @param viewer - Viewer kind.
 * @returns A viewer href for the project detail page.
 */
export function viewerHref(project: Project, viewer: ProjectViewerKind): string {
  return projectDetailViewerHref(project.slug, viewer);
}

/**
 * @param projects - Ordered project collection.
 * @param project - Active project.
 * @param viewer - Active viewer kind.
 * @returns Previous and next project toolbar actions.
 */
export function projectNavigationActions(
  projects: ReadonlyArray<Project>,
  project: Project,
  viewer: ProjectViewerKind,
): Array<FileViewerAction> {
  const index = projects.findIndex((item) => item.slug === project.slug);
  const previous = index > 0 ? projects[index - 1] : undefined;
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : undefined;
  const actions: Array<FileViewerAction> = [];

  if (previous) {
    actions.push({
      icon: <ArrowLeft aria-hidden="true" className="size-4" />,
      label: "Previous",
      to: viewerHref(previous, viewer),
    });
  }

  if (next) {
    actions.push({
      icon: <ArrowRight aria-hidden="true" className="size-4" />,
      label: "Next",
      to: viewerHref(next, viewer),
    });
  }

  return actions;
}

/**
 * @param target - Click event target inside an iframe document.
 * @returns The nearest anchor element without using cross-document selector APIs.
 */
function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  let node = target;

  while (node && "nodeType" in node) {
    const element = node as Element;

    if (element.tagName === "A" && typeof element.getAttribute === "function") {
      return element as HTMLAnchorElement;
    }

    node = element.parentElement;
  }

  return null;
}

/**
 * @param frame - Docs iframe loaded from the same origin.
 * @param diagramsHref - Viewer href to use when a docs diagram link is clicked.
 * @param navigate - Navigation side effect used when a diagram link is intercepted.
 * @returns Nothing; cross-origin frames are ignored by browser policy.
 */
export function wireDocsDiagramLinks(
  frame: HTMLIFrameElement,
  diagramsHref: string,
  navigate: (href: string) => void = (href) => {
    navigateInPlace(href);
  },
): void {
  try {
    const frameDocument = frame.contentDocument;
    if (!frameDocument) return;

    const clickRoot = frameDocument.body ?? frameDocument;

    clickRoot.addEventListener("click", (event) => {
      const link = closestAnchor(event.target);
      const href = link?.getAttribute("href") ?? "";

      if (!link || !href.includes("diagrams/")) {
        return;
      }

      event.preventDefault();
      navigate(diagramsHref);
    });
  } catch {
    // Cross-origin artifact frames cannot be inspected. The Diagrams action remains available.
  }
}
