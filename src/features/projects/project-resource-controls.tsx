"use client";

import type { ReactNode } from "react";
import { TypographyEyebrow, TypographyH1, TypographyP } from "@/components/ui/typography";
import type { ArtifactItem, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { FileViewerDrawer } from "@/features/viewer/file-viewer-drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import { DownloadActions, ProjectLinkActions } from "./project-actions";
import { ProjectDetailActionGroup, ProjectStackChips } from "./project-resource-action-sections";
import { DiagramSelector, ProjectViewerTabs } from "./project-resource-tabs";
import type { ProjectViewerKind } from "./project-viewer-model";

interface ProjectResourceControlsProps {
  readonly actions: ReactNode;
  readonly activeViewer: ProjectViewerKind;
  readonly diagrams: ReadonlyArray<ArtifactItem>;
  readonly headingId: string;
  readonly project: Project;
  readonly selectedDiagramId?: string | undefined;
}

const mobileViewerActionsMediaQuery = "(max-width: 1023px)";

/**
 * @param props - Header, drawer controls, and viewer action placement for a project resource.
 * @returns Project resource viewer header chrome.
 */
export function ProjectResourceControls({
  actions,
  activeViewer,
  diagrams,
  headingId,
  project,
  selectedDiagramId,
}: ProjectResourceControlsProps): ReactNode {
  const mobileViewerActionsMatch = useMediaQuery(mobileViewerActionsMediaQuery);
  const mobileViewerActions = mobileViewerActionsMatch ?? false;
  const drawerStateKey =
    mobileViewerActionsMatch === undefined
      ? undefined
      : mobileViewerActions
        ? "project-resource-viewer:mobile"
        : "project-resource-viewer:desktop";
  const headerAnchorId = `${headingId}-viewer-header`;

  return (
    <>
      <header className="project-detail-header" id={headerAnchorId}>
        <div className="project-detail-header-main">
          <ThemedIconImage
            alt=""
            aria-hidden="true"
            className="project-asset-icon"
            src={project.icon}
          />
          <div className="min-w-0">
            <TypographyEyebrow className="text-(--warm)">{project.status}</TypographyEyebrow>
            <TypographyH1 className="mt-3" id={headingId}>
              {project.title}
            </TypographyH1>
            <TypographyP className="text-measure mt-4">{project.summary}</TypographyP>
          </div>
        </div>
        {!mobileViewerActions ? (
          <div className="project-detail-header-actions">
            <ProjectDetailActionGroup ariaLabel={`${project.title} viewer actions`} label="Viewer">
              {actions}
            </ProjectDetailActionGroup>
          </div>
        ) : null}
      </header>
      <FileViewerDrawer
        anchorId={headerAnchorId}
        ariaLabel={`${project.title} viewer controls`}
        className="project-detail-navigation"
        stateKey={drawerStateKey}
      >
        <div className="project-detail-drawer-actions">
          <div className="project-detail-stack-section" data-file-viewer-drawer-section>
            <ProjectDetailActionGroup ariaLabel={`${project.title} stack`} label="Stack">
              <ProjectStackChips project={project} />
            </ProjectDetailActionGroup>
          </div>
          {mobileViewerActions && project.links.length > 0 ? (
            <div className="project-detail-mobile-action-section" data-file-viewer-drawer-section>
              <ProjectDetailActionGroup
                ariaLabel={`${project.title} project actions`}
                className="project-detail-header-project-actions"
                label="Project"
              >
                <ProjectLinkActions links={project.links} liveVariant="secondary" />
              </ProjectDetailActionGroup>
            </div>
          ) : null}
          {mobileViewerActions && project.downloads.length > 0 ? (
            <div
              className={cn(
                "project-detail-mobile-action-section",
                project.links.length > 0 && "project-detail-mobile-action-section--separated",
              )}
              data-file-viewer-drawer-section
            >
              <ProjectDetailActionGroup
                ariaLabel={`${project.title} desktop downloads`}
                label="Desktop"
              >
                <DownloadActions downloads={project.downloads} />
              </ProjectDetailActionGroup>
            </div>
          ) : null}
          {!mobileViewerActions && (project.links.length > 0 || project.downloads.length > 0) ? (
            <div className="project-detail-drawer-action-row" data-file-viewer-drawer-section>
              {project.links.length > 0 ? (
                <ProjectDetailActionGroup
                  ariaLabel={`${project.title} project actions`}
                  className="project-detail-header-project-actions"
                  label="Project"
                >
                  <ProjectLinkActions links={project.links} liveVariant="secondary" />
                </ProjectDetailActionGroup>
              ) : null}
              {project.downloads.length > 0 ? (
                <ProjectDetailActionGroup
                  ariaLabel={`${project.title} desktop downloads`}
                  label="Desktop"
                >
                  <DownloadActions downloads={project.downloads} />
                </ProjectDetailActionGroup>
              ) : null}
            </div>
          ) : null}
          {mobileViewerActions ? (
            <div className="project-detail-drawer-viewer-actions" data-file-viewer-drawer-section>
              <ProjectDetailActionGroup
                ariaLabel={`${project.title} viewer actions`}
                label="Viewer"
              >
                {actions}
              </ProjectDetailActionGroup>
            </div>
          ) : null}
          <div data-file-viewer-drawer-section>
            <ProjectDetailActionGroup
              ariaLabel={`${project.title} resource views`}
              className="project-detail-view-actions"
              label="Views"
            >
              <ProjectViewerTabs project={project} viewer={activeViewer} />
              <DiagramSelector
                items={diagrams}
                project={project}
                selectedDiagramId={selectedDiagramId}
              />
            </ProjectDetailActionGroup>
          </div>
        </div>
      </FileViewerDrawer>
    </>
  );
}
