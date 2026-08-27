import type { ReactNode } from "react";
import { TypographyH1, TypographyP } from "@/components/ui/typography";
import type { ArtifactItem, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { FileViewerDrawer } from "@/features/viewer/file-viewer-drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import { DownloadActions, ProjectLinkActions } from "./project-actions";
import { ProjectDetailActionGroup, ProjectStackChips } from "./project-resource-action-sections";
import { CoverageSelector, DiagramSelector, ProjectViewerTabs } from "./project-resource-tabs";
import { ProjectStatusBadge } from "./project-status-badge";
import type { ProjectViewerKind } from "./project-viewer-model";

interface ProjectResourceControlsProps {
  readonly actions: ReactNode;
  readonly activeViewer: ProjectViewerKind;
  readonly coveragePages: ReadonlyArray<ArtifactItem>;
  readonly diagrams: ReadonlyArray<ArtifactItem>;
  readonly headingId: string;
  readonly project: Project;
  readonly selectedDiagramId?: string | undefined;
  readonly selectedCoverageId?: string | undefined;
}

const mobileViewerActionsMediaQuery = "(max-width: 1023px)";

function projectResourceDrawerStateKey(
  mobileViewerActionsMatch: boolean | undefined,
): string | undefined {
  if (mobileViewerActionsMatch === undefined) {
    return undefined;
  }

  return mobileViewerActionsMatch
    ? "project-resource-viewer:mobile"
    : "project-resource-viewer:desktop";
}

function ProjectResourceHeader({
  actions,
  headingId,
  mobileViewerActions,
  project,
}: Pick<ProjectResourceControlsProps, "actions" | "headingId" | "project"> & {
  readonly mobileViewerActions: boolean;
}): ReactNode {
  return (
    <header className="project-detail-header" id={`${headingId}-viewer-header`}>
      <div className="project-detail-header-main">
        <ThemedIconImage
          alt=""
          aria-hidden="true"
          className={cn(
            "project-asset-icon",
            project.slug === "cipher" && "project-asset-icon--canonical",
          )}
          src={project.icon}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <TypographyH1 id={headingId}>{project.title}</TypographyH1>
            <ProjectStatusBadge project={project} />
          </div>
          <TypographyP className="text-measure mt-4">{project.summary}</TypographyP>
        </div>
      </div>
      {mobileViewerActions ? null : (
        <div className="project-detail-header-actions">
          <ProjectDetailActionGroup ariaLabel={`${project.title} viewer actions`} label="Viewer">
            {actions}
          </ProjectDetailActionGroup>
        </div>
      )}
    </header>
  );
}

function MobileViewerActions({
  actions,
  mobileViewerActions,
  project,
}: Pick<ProjectResourceControlsProps, "actions" | "project"> & {
  readonly mobileViewerActions: boolean;
}): ReactNode {
  if (!mobileViewerActions) {
    return null;
  }

  return (
    <div className="project-detail-drawer-viewer-actions" data-file-viewer-drawer-section>
      <ProjectDetailActionGroup ariaLabel={`${project.title} viewer actions`} label="Viewer">
        {actions}
      </ProjectDetailActionGroup>
    </div>
  );
}

function ProjectResourceViews({
  activeViewer,
  coveragePages,
  diagrams,
  project,
  selectedCoverageId,
  selectedDiagramId,
}: Omit<ProjectResourceControlsProps, "actions" | "headingId">): ReactNode {
  return (
    <div data-file-viewer-drawer-section>
      <ProjectDetailActionGroup
        ariaLabel={`${project.title} resource views`}
        className="project-detail-view-actions"
        label="Views"
      >
        <ProjectViewerTabs project={project} viewer={activeViewer} />
        <DiagramSelector items={diagrams} project={project} selectedDiagramId={selectedDiagramId} />
        <CoverageSelector
          items={coveragePages}
          project={project}
          selectedCoverageId={selectedCoverageId}
        />
      </ProjectDetailActionGroup>
    </div>
  );
}

function MobileProjectActions({
  mobileViewerActions,
  project,
}: Pick<ProjectResourceControlsProps, "project"> & {
  readonly mobileViewerActions: boolean;
}): ReactNode {
  if (!mobileViewerActions || project.links.length === 0) {
    return null;
  }

  return (
    <div className="project-detail-mobile-action-section" data-file-viewer-drawer-section>
      <ProjectDetailActionGroup
        ariaLabel={`${project.title} project actions`}
        className="project-detail-header-project-actions"
        label="Project"
      >
        <ProjectLinkActions links={project.links} liveVariant="secondary" />
      </ProjectDetailActionGroup>
    </div>
  );
}

function MobileDownloadActions({
  mobileViewerActions,
  project,
}: Pick<ProjectResourceControlsProps, "project"> & {
  readonly mobileViewerActions: boolean;
}): ReactNode {
  if (!mobileViewerActions || project.downloads.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "project-detail-mobile-action-section",
        project.links.length > 0 && "project-detail-mobile-action-section--separated",
      )}
      data-file-viewer-drawer-section
    >
      <ProjectDetailActionGroup ariaLabel={`${project.title} desktop downloads`} label="Desktop">
        <DownloadActions downloads={project.downloads} />
      </ProjectDetailActionGroup>
    </div>
  );
}

function DesktopProjectActions({
  mobileViewerActions,
  project,
}: Pick<ProjectResourceControlsProps, "project"> & {
  readonly mobileViewerActions: boolean;
}): ReactNode {
  if (mobileViewerActions || (project.links.length === 0 && project.downloads.length === 0)) {
    return null;
  }

  return (
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
        <ProjectDetailActionGroup ariaLabel={`${project.title} desktop downloads`} label="Desktop">
          <DownloadActions downloads={project.downloads} />
        </ProjectDetailActionGroup>
      ) : null}
    </div>
  );
}

function ProjectResourceDrawerActions({
  actions,
  activeViewer,
  coveragePages,
  diagrams,
  mobileViewerActions,
  project,
  selectedCoverageId,
  selectedDiagramId,
}: Omit<ProjectResourceControlsProps, "headingId"> & {
  readonly mobileViewerActions: boolean;
}): ReactNode {
  return (
    <div className="project-detail-drawer-actions">
      <MobileViewerActions
        actions={actions}
        mobileViewerActions={mobileViewerActions}
        project={project}
      />
      <ProjectResourceViews
        activeViewer={activeViewer}
        coveragePages={coveragePages}
        diagrams={diagrams}
        project={project}
        selectedCoverageId={selectedCoverageId}
        selectedDiagramId={selectedDiagramId}
      />
      <MobileProjectActions mobileViewerActions={mobileViewerActions} project={project} />
      <MobileDownloadActions mobileViewerActions={mobileViewerActions} project={project} />
      <DesktopProjectActions mobileViewerActions={mobileViewerActions} project={project} />
      <div className="project-detail-stack-section" data-file-viewer-drawer-section>
        <ProjectDetailActionGroup ariaLabel={`${project.title} stack`} label="Stack">
          <ProjectStackChips project={project} />
        </ProjectDetailActionGroup>
      </div>
    </div>
  );
}

/**
 * @param props - Header, drawer controls, and viewer action placement for a project resource.
 * @returns Project resource viewer header chrome.
 */
export function ProjectResourceControls({
  actions,
  activeViewer,
  coveragePages,
  diagrams,
  headingId,
  project,
  selectedDiagramId,
  selectedCoverageId,
}: ProjectResourceControlsProps): ReactNode {
  const mobileViewerActionsMatch = useMediaQuery(mobileViewerActionsMediaQuery);
  const mobileViewerActions = mobileViewerActionsMatch ?? false;
  const drawerStateKey = projectResourceDrawerStateKey(mobileViewerActionsMatch);
  const headerAnchorId = `${headingId}-viewer-header`;

  return (
    <>
      <ProjectResourceHeader
        actions={actions}
        headingId={headingId}
        mobileViewerActions={mobileViewerActions}
        project={project}
      />
      <FileViewerDrawer
        anchorId={headerAnchorId}
        ariaLabel={`${project.title} viewer controls`}
        className="project-detail-navigation"
        stateKey={drawerStateKey}
      >
        <ProjectResourceDrawerActions
          actions={actions}
          activeViewer={activeViewer}
          coveragePages={coveragePages}
          diagrams={diagrams}
          mobileViewerActions={mobileViewerActions}
          project={project}
          selectedCoverageId={selectedCoverageId}
          selectedDiagramId={selectedDiagramId}
        />
      </FileViewerDrawer>
    </>
  );
}
