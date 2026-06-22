"use client";

import type { ReactNode } from "react";
import { absoluteSiteUrl } from "@/config/public-env";
import type { PortfolioContent, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { FileViewer } from "@/features/viewer/file-viewer";
import { emailContact, mailtoHref } from "@/lib/contact";
import { profileGreetingName } from "@/lib/profile";
import { MissingArtifactFallback, ProjectOverviewContent } from "./project-resource-content";
import { ProjectResourceControls } from "./project-resource-controls";
import {
  artifactForViewer,
  diagramItems,
  projectNavigationActions,
  selectedDiagramItem,
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
  const selectedDiagram =
    activeViewer === "diagrams" ? selectedDiagramItem(diagrams, diagram) : undefined;
  const sourceHref =
    artifact && !artifact.comingSoon ? (selectedDiagram?.href ?? artifact.href) : undefined;
  const absoluteViewerHref = absoluteSiteUrl(projectDetailViewerHref(project.slug, activeViewer));
  const emailHref = mailtoHref(
    emailContact(content.contacts),
    `${project.title} follow-up`,
    `Hi ${profileGreetingName(content.profile)},\n\nI viewed ${project.title} here:\n${absoluteViewerHref}\n`,
  );
  const title =
    activeViewer === "diagrams" && selectedDiagram
      ? `${project.title} ${selectedDiagram.label}`
      : `${project.title} ${projectViewerLabel(activeViewer)}`;
  const navigationActions = projectNavigationActions(projects, project, activeViewer);
  const diagramsHref = viewerHref(project, "diagrams");

  return (
    <section className="project-detail-panel scroll-mt-24" id="project-viewer">
      <FileViewer
        actions={navigationActions}
        ariaLabel={`${project.title} ${projectViewerLabel(activeViewer)} viewer`}
        downloadHref={activeViewer !== "project" ? sourceHref : undefined}
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
            diagrams={diagrams}
            headingId={headingId}
            project={project}
            selectedDiagramId={selectedDiagram?.id}
          />
        )}
        sourceHref={sourceHref}
        title={title}
      >
        {activeViewer === "project" ? <ProjectOverviewContent project={project} /> : null}
        {activeViewer !== "project" && !artifact ? (
          <MissingArtifactFallback project={project} viewer={activeViewer} />
        ) : null}
      </FileViewer>
    </section>
  );
}
