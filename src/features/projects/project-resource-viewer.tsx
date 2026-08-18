import type { ReactNode } from "react";
import { absoluteSiteUrl } from "@/config/public-env";
import type { PortfolioContent, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { FileViewer } from "@/features/viewer/file-viewer";
import { emailContact, mailtoHref } from "@/lib/contact";
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
  const iframeSourceHref = activeViewer === "diagrams" ? undefined : sourceHref;
  const download = artifactDownload(project, activeViewer, artifact, sourceHref, selectedItem);
  const absoluteViewerHref = absoluteSiteUrl(projectDetailViewerHref(project.slug, activeViewer));
  const emailHref = mailtoHref(
    emailContact(content.contacts),
    `${project.title} follow-up`,
    `Hi ${profileGreetingName(content.profile)},\n\nI viewed ${project.title} here:\n${absoluteViewerHref}\n`,
  );
  const title = selectedItem
    ? `${project.title} ${selectedItem.label}`
    : `${project.title} ${projectViewerLabel(activeViewer)}`;
  const navigationActions = projectNavigationActions(projects, project, activeViewer);
  const diagramsHref = viewerHref(project, "diagrams");

  return (
    <section className="project-detail-panel scroll-mt-24" id="project-viewer">
      <FileViewer
        actions={navigationActions}
        ariaLabel={`${project.title} ${projectViewerLabel(activeViewer)} viewer`}
        contentLayout={activeViewer === "diagrams" ? "viewport" : "flow"}
        download={download}
        emailHref={emailHref}
        iframeTitle={title}
        icon={
          <ThemedIconImage
            alt=""
            aria-hidden="true"
            className="file-viewer-project-icon"
            src={project.icon}
          />
        }
        onFrameLoad={
          activeViewer === "docs"
            ? (frame) => connectDocsDiagramLinks(frame, diagramsHref)
            : undefined
        }
        openHref={sourceHref}
        renderHeader={({ actions }) => (
          <ProjectResourceControls
            actions={actions}
            activeViewer={activeViewer}
            coveragePages={coveragePages}
            diagrams={diagrams}
            headingId={headingId}
            project={project}
            selectedDiagramId={selectedDiagram?.id}
            selectedCoverageId={selectedCoverage?.id}
          />
        )}
        sourceHref={iframeSourceHref}
        title={title}
      >
        {activeViewer === "project" ? <ProjectOverviewContent project={project} /> : null}
        {activeViewer === "diagrams" && sourceHref ? (
          <ProjectDiagramPreview href={sourceHref} title={title} />
        ) : null}
        {activeViewer !== "project" && !artifact ? (
          <MissingArtifactFallback project={project} viewer={activeViewer} />
        ) : null}
      </FileViewer>
    </section>
  );
}
