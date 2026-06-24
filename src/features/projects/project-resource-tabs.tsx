import type { MouseEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ArtifactItem, Project } from "@/content/schema";
import { navigateInPlace } from "@/features/viewer/file-viewer";
import { ComingSoonAction } from "./project-actions";
import { artifactForViewer, viewerHref } from "./project-resource-helpers";
import {
  projectDetailViewerHref,
  projectViewerKinds,
  projectViewerLabel,
  type ProjectViewerKind,
} from "./project-viewer-model";

interface ProjectViewerTabsProps {
  readonly project: Project;
  readonly viewer: ProjectViewerKind;
}

interface DiagramSelectorProps {
  readonly project: Project;
  readonly selectedDiagramId?: string | undefined;
  readonly items: ReadonlyArray<ArtifactItem>;
}

/**
 * @param event - Link click event for a project viewer route.
 * @param href - Internal project viewer href.
 * @returns Nothing; plain clicks update history in place while modified clicks stay native.
 */
function navigateViewerLink(event: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }

  const target = event.currentTarget.getAttribute("target");
  if (target && target !== "_self") {
    return;
  }

  event.preventDefault();
  navigateInPlace(href);
}

/**
 * @param props - Project and active viewer state.
 * @returns Resource selector buttons for one project.
 */
export function ProjectViewerTabs({ project, viewer }: ProjectViewerTabsProps): ReactNode {
  return (
    <nav aria-label={`${project.title} resource views`} className="project-viewer-tabs">
      {projectViewerKinds.map((item) => {
        const artifact = item === "project" ? undefined : artifactForViewer(project, item);
        const label = projectViewerLabel(item);

        if (item !== "project" && !artifact) {
          return null;
        }

        if (artifact?.comingSoon) {
          return (
            <ComingSoonAction key={item} label={label}>
              {label}
            </ComingSoonAction>
          );
        }

        const href = viewerHref(project, item);

        return (
          <Button
            asChild
            key={item}
            size="small"
            variant={item === viewer ? "secondary" : "outline"}
          >
            <a href={href} onClick={(event) => navigateViewerLink(event, href)}>
              {label}
            </a>
          </Button>
        );
      })}
    </nav>
  );
}

/**
 * @param props - Diagram collection and selected route state.
 * @returns Route-backed diagram selector buttons.
 */
export function DiagramSelector({
  items,
  project,
  selectedDiagramId,
}: DiagramSelectorProps): ReactNode {
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label={`${project.title} diagrams`} className="diagram-selector">
      {items.map((item) => {
        const href = projectDetailViewerHref(project.slug, "diagrams", { diagram: item.id });

        return (
          <Button
            asChild
            key={item.id}
            size="small"
            variant={item.id === selectedDiagramId ? "secondary" : "outline"}
          >
            <a href={href} onClick={(event) => navigateViewerLink(event, href)}>
              {item.label}
            </a>
          </Button>
        );
      })}
    </nav>
  );
}
