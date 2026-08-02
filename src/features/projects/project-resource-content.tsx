import { Blocks, CircleAlert, Compass, NotebookText } from "lucide-react";
import type { ReactNode } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import { TypographyEyebrow, TypographyH3, TypographyMuted } from "@/components/ui/typography";
import type { Project } from "@/content/schema";
import { renderMarkdown } from "@/lib/markdown";
import { projectViewerLabel, type ProjectViewerKind } from "./project-viewer-model";

/**
 * @param project - Project to render.
 * @returns Markdown-backed project overview content.
 */
export function ProjectOverviewContent({ project }: { readonly project: Project }): ReactNode {
  return (
    <div className="project-file-content project-overview">
      <div className="project-overview-grid grid gap-4 md:grid-cols-2">
        <section className="narrative-card project-overview-card p-5">
          <div className="project-overview-heading">
            <span className="project-overview-icon">
              <CircleAlert aria-hidden="true" className="size-5" />
            </span>
            <div>
              <TypographyEyebrow className="text-(--warm)">Context</TypographyEyebrow>
              <TypographyH3 as="h2" className="mt-1">
                Problem
              </TypographyH3>
            </div>
          </div>
          <TypographyMuted className="text-measure mt-3">{project.problem}</TypographyMuted>
        </section>
        <section className="narrative-card project-overview-card p-5">
          <div className="project-overview-heading">
            <span className="project-overview-icon">
              <Blocks aria-hidden="true" className="size-5" />
            </span>
            <div>
              <TypographyEyebrow className="text-(--warm)">System</TypographyEyebrow>
              <TypographyH3 as="h2" className="mt-1">
                Architecture
              </TypographyH3>
            </div>
          </div>
          <TypographyMuted className="text-measure mt-3">{project.architecture}</TypographyMuted>
        </section>
      </div>
      <section className="project-overview-notes surface-card mt-4 p-5">
        <div className="project-overview-heading">
          <span className="project-overview-icon">
            <NotebookText aria-hidden="true" className="size-5" />
          </span>
          <div>
            <TypographyEyebrow className="text-(--warm)">Reference</TypographyEyebrow>
            <TypographyH3 as="h2" className="mt-1">
              Project Notes
            </TypographyH3>
          </div>
        </div>
        <div
          className="portfolio-markdown prose-surface mt-4 text-sm leading-7 text-(--muted)"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(project.markdown) }}
        />
      </section>
    </div>
  );
}

/**
 * @param project - Project whose requested artifact is missing.
 * @param viewer - Missing viewer kind.
 * @returns A shared not-found panel scoped to the embedded file viewer.
 */
export function MissingArtifactFallback({
  project,
  viewer,
}: {
  readonly project: Project;
  readonly viewer: ProjectViewerKind;
}): ReactNode {
  const label = projectViewerLabel(viewer);
  const lowerLabel = label.toLowerCase();

  return (
    <StatusPanel
      className="project-viewer-empty"
      eyebrow="Artifact not found"
      headingId={`${project.slug}-${viewer}-missing-heading`}
      icon={<Compass aria-hidden="true" className="size-6" />}
      message={`${project.title} does not have a ${lowerLabel} artifact configured for this viewer yet.`}
      title={`${label} not found`}
      titleAs="h2"
      titleSize="section"
    />
  );
}
