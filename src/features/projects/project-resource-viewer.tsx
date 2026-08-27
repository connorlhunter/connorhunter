import type { ReactNode } from "react";
import { absoluteSiteUrl } from "@/config/public-env";
import type { ArtifactItem, ArtifactLink, PortfolioContent, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { FileViewer } from "@/features/viewer/file-viewer";
import { emailContact, mailtoHref } from "@/lib/contact";
import { cn } from "@/lib/cn";
import { profileGreetingName } from "@/lib/profile";
import { ProjectDiagramPreview } from "./project-diagram-preview";
import { MissingArtifactFallback, ProjectOverviewContent } from "./project-resource-content";
import { ProjectResourceControls } from "./project-resource-controls";
import {
  artifactForViewer,
  artifactDownload,
  coverageItems,
  diagramItems,
  projectNavigationActions,
  selectedDiagramItem,
  selectedCoverageItem,
  viewerHref,
  wireDocsDiagramLinks as connectDocsDiagramLinks,
} from "./project-resource-helpers";
import {
  projectDetailViewerHref,
  projectViewerLabel,
  type ProjectViewerKind,
} from "./project-viewer-model";

export { wireDocsDiagramLinks } from "./project-resource-helpers";

interface ProjectResourceViewerProps {
  readonly content: PortfolioContent;
  readonly coverage?: string | undefined;
  readonly diagram?: string | undefined;
  readonly headingId: string;
  readonly project: Project;
  readonly projects: ReadonlyArray<Project>;
  readonly viewer: ProjectViewerKind;
}

interface ProjectResourceViewerState {
  readonly activeViewer: ProjectViewerKind;
  readonly artifact: ArtifactLink | undefined;
  readonly coveragePages: ReadonlyArray<ArtifactItem>;
  readonly diagrams: ReadonlyArray<ArtifactItem>;
  readonly iframeSourceHref: string | undefined;
  readonly selectedCoverage: ArtifactItem | undefined;
  readonly selectedDiagram: ArtifactItem | undefined;
  readonly selectedItem: ArtifactItem | undefined;
  readonly sourceHref: string | undefined;
}

function projectResourceViewerState(
  project: Project,
  viewer: ProjectViewerKind,
  coverage: string | undefined,
  diagram: string | undefined,
): ProjectResourceViewerState {
  const requestedArtifact = artifactForViewer(project, viewer);
  const activeViewer = viewer !== "project" && requestedArtifact?.comingSoon ? "project" : viewer;
  const artifact = artifactForViewer(project, activeViewer);
  const diagrams = activeViewer === "diagrams" ? diagramItems(artifact) : [];
  const coveragePages = activeViewer === "coverage" ? coverageItems(artifact) : [];
  const selectedDiagram =
    activeViewer === "diagrams" ? selectedDiagramItem(diagrams, diagram) : undefined;
  const selectedCoverage =
    activeViewer === "coverage" ? selectedCoverageItem(coveragePages, coverage) : undefined;
  const selectedItem = selectedDiagram ?? selectedCoverage;
  const sourceHref =
    artifact && !artifact.comingSoon ? (selectedItem?.href ?? artifact.href) : undefined;

  return {
    activeViewer,
    artifact,
    coveragePages,
    diagrams,
    iframeSourceHref: activeViewer === "diagrams" ? undefined : sourceHref,
    selectedCoverage,
    selectedDiagram,
    selectedItem,
    sourceHref,
  };
}

function projectResourceViewerTitle(
  project: Project,
  viewer: ProjectViewerKind,
  selectedItem: ArtifactItem | undefined,
): string {
  if (selectedItem) {
    return `${project.title} ${selectedItem.label}`;
  }

  return `${project.title} ${projectViewerLabel(viewer)}`;
}

function projectResourceViewerEmailHref(
  content: PortfolioContent,
  project: Project,
  viewer: ProjectViewerKind,
): string {
  const absoluteViewerHref = absoluteSiteUrl(projectDetailViewerHref(project.slug, viewer));

  return mailtoHref(
    emailContact(content.contacts),
    `${project.title} follow-up`,
    `Hi ${profileGreetingName(content.profile)},\n\nI viewed ${project.title} here:\n${absoluteViewerHref}\n`,
  );
}

function projectResourceContentLayout(viewer: ProjectViewerKind): "flow" | "viewport" {
  return viewer === "diagrams" ? "viewport" : "flow";
}

function docsFrameLoadHandler(
  viewer: ProjectViewerKind,
  diagramsHref: string,
): ((frame: HTMLIFrameElement) => void) | undefined {
  if (viewer !== "docs") {
    return undefined;
  }

  return (frame) => connectDocsDiagramLinks(frame, diagramsHref);
}

function ProjectResourceViewerHeader({
  actions,
  headingId,
  project,
  state,
}: {
  readonly actions: ReactNode;
  readonly headingId: string;
  readonly project: Project;
  readonly state: ProjectResourceViewerState;
}): ReactNode {
  return (
    <ProjectResourceControls
      actions={actions}
      activeViewer={state.activeViewer}
      coveragePages={state.coveragePages}
      diagrams={state.diagrams}
      headingId={headingId}
      project={project}
      selectedCoverageId={state.selectedCoverage?.id}
      selectedDiagramId={state.selectedDiagram?.id}
    />
  );
}

function ProjectResourceViewerContent({
  project,
  state,
  title,
}: {
  readonly project: Project;
  readonly state: ProjectResourceViewerState;
  readonly title: string;
}): ReactNode {
  if (state.activeViewer === "project") {
    return <ProjectOverviewContent project={project} />;
  }

  if (state.activeViewer === "diagrams" && state.sourceHref) {
    return <ProjectDiagramPreview href={state.sourceHref} title={title} />;
  }

  if (!state.artifact) {
    return <MissingArtifactFallback project={project} viewer={state.activeViewer} />;
  }

  return null;
}

/**
 * @param props - Project and artifact viewer state.
 * @returns A centralized resume-style viewer for project notes, docs, diagrams, or coverage.
 */
export function ProjectResourceViewer({
  content,
  coverage,
  diagram,
  headingId,
  project,
  projects,
  viewer,
}: ProjectResourceViewerProps): ReactNode {
  const state = projectResourceViewerState(project, viewer, coverage, diagram);
  const download = artifactDownload(
    project,
    state.activeViewer,
    state.artifact,
    state.sourceHref,
    state.selectedItem,
  );
  const emailHref = projectResourceViewerEmailHref(content, project, state.activeViewer);
  const title = projectResourceViewerTitle(project, state.activeViewer, state.selectedItem);
  const navigationActions = projectNavigationActions(projects, project, state.activeViewer);
  const diagramsHref = viewerHref(project, "diagrams");

  return (
    <section className="project-detail-panel scroll-mt-24" id="project-viewer">
      <FileViewer
        actions={navigationActions}
        ariaLabel={`${project.title} ${projectViewerLabel(state.activeViewer)} viewer`}
        contentLayout={projectResourceContentLayout(state.activeViewer)}
        download={download}
        emailHref={emailHref}
        iframeTitle={title}
        icon={
          <ThemedIconImage
            alt=""
            aria-hidden="true"
            className={cn(
              "file-viewer-project-icon",
              project.slug === "cipher" && "file-viewer-project-icon--canonical",
            )}
            src={project.icon}
          />
        }
        onFrameLoad={docsFrameLoadHandler(state.activeViewer, diagramsHref)}
        openHref={state.sourceHref}
        renderHeader={({ actions }) => (
          <ProjectResourceViewerHeader
            actions={actions}
            headingId={headingId}
            project={project}
            state={state}
          />
        )}
        sourceHref={state.iframeSourceHref}
        title={title}
      >
        <ProjectResourceViewerContent project={project} state={state} title={title} />
      </FileViewer>
    </section>
  );
}
