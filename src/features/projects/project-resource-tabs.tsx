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

interface CoverageSelectorProps {
  readonly project: Project;
  readonly selectedCoverageId?: string | undefined;
  readonly items: ReadonlyArray<ArtifactItem>;
}

const diagramDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/**
 * @param value - ISO diagram publication date.
 * @returns A readable UTC date for picker metadata.
 */
function formatDiagramDate(value: string): string {
  return diagramDateFormatter.format(new Date(`${value}T00:00:00Z`));
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
    <nav
      aria-label={`${project.title} diagrams`}
      className="diagram-selector diagram-selector--wrapping"
    >
      {items.map((item, index) => {
        const href = projectDetailViewerHref(project.slug, "diagrams", { diagram: item.id });
        const updatedDate = item.lastUpdated ? formatDiagramDate(item.lastUpdated) : undefined;
        const metadataLabel =
          item.version && updatedDate
            ? `${item.label}, version ${item.version}, updated ${updatedDate}`
            : undefined;

        return (
          <span className="diagram-selector-item" key={item.id}>
            {index === 1 && items[0]?.label === "Diagram Style Key" ? (
              <span aria-hidden="true" className="diagram-selector-divider" />
            ) : null}
            <Button
              asChild
              className="diagram-selector-link"
              size="small"
              variant={item.id === selectedDiagramId ? "secondary" : "outline"}
            >
              <a
                aria-label={metadataLabel}
                href={href}
                onClick={(event) => navigateViewerLink(event, href)}
              >
                <span className="diagram-selector-copy">
                  <span className="diagram-selector-title">{item.label}</span>
                  {item.version && item.lastUpdated && updatedDate ? (
                    <span className="diagram-selector-metadata">
                      <span>v{item.version}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        Updated <time dateTime={item.lastUpdated}>{updatedDate}</time>
                      </span>
                    </span>
                  ) : null}
                </span>
              </a>
            </Button>
          </span>
        );
      })}
    </nav>
  );
}

/**
 * @param props - Coverage page collection and selected route state.
 * @returns Route-backed coverage page selector buttons.
 */
export function CoverageSelector({
  items,
  project,
  selectedCoverageId,
}: CoverageSelectorProps): ReactNode {
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label={`${project.title} coverage pages`} className="diagram-selector">
      {items.map((item) => {
        const href = projectDetailViewerHref(project.slug, "coverage", { coverage: item.id });

        return (
          <Button
            asChild
            key={item.id}
            size="small"
            variant={item.id === selectedCoverageId ? "secondary" : "outline"}
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
