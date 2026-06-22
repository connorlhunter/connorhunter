import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PortfolioContent, Project } from "@/content/schema";
import { ProjectResourceViewer } from "./project-resource-viewer";
import { type ProjectViewerKind } from "./project-viewer-model";
import { SiteLayout } from "@/features/shell/site-layout";

interface ProjectDetailPageProps {
  readonly content: PortfolioContent;
  readonly diagram?: string | undefined;
  readonly project: Project;
  readonly viewer?: ProjectViewerKind;
}

/**
 * @param props - Portfolio content and selected project record.
 * @returns The project detail page.
 */
export function ProjectDetailPage({
  content,
  diagram,
  project,
  viewer = "project",
}: ProjectDetailPageProps): ReactNode {
  const headingId = `${project.slug}-detail-heading`;

  return (
    <SiteLayout content={content}>
      <article aria-labelledby={headingId} className="page-band">
        <div className="page-container">
          <nav aria-label="Project navigation" className="mb-8">
            <Button asChild variant="outline">
              <a href="/projects">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Projects
              </a>
            </Button>
          </nav>

          <ProjectResourceViewer
            content={content}
            diagram={diagram}
            headingId={headingId}
            project={project}
            projects={content.projects}
            viewer={viewer}
          />
        </div>
      </article>
    </SiteLayout>
  );
}
