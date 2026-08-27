import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { PortfolioContent, Project } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";
import { ProjectResourceShell } from "./project-resource-pages";
import { projectResourceFromPathname, projectResourceHref } from "./project-resource-routes";

interface ProjectDetailPageProps {
  readonly children: ReactNode;
  readonly content: PortfolioContent;
  readonly project: Project;
}

/** Persistent shell for the nested project resource routes. */
export function ProjectDetailPage({
  children,
  content,
  project,
}: ProjectDetailPageProps): ReactNode {
  const { pathname } = useLocation();
  const resource = projectResourceFromPathname(pathname, project.slug);
  const projectIndex = content.projects.findIndex((item) => item.slug === project.slug);
  const previousProject = projectIndex > 0 ? content.projects[projectIndex - 1] : undefined;
  const nextProject = projectIndex >= 0 ? content.projects[projectIndex + 1] : undefined;

  return (
    <SiteLayout content={content} contentSource="Published project content">
      <article className="page-band">
        <div className="page-container">
          <nav
            aria-label="Project navigation"
            className="page-motion-nav project-detail-navigation mb-8"
          >
            <Button asChild variant="outline">
              <Link to="/projects">
                <ArrowLeft aria-hidden="true" className="size-4" /> Projects
              </Link>
            </Button>
            <div aria-label="Adjacent projects" className="project-detail-navigation-actions">
              {previousProject ? (
                <Button asChild variant="outline">
                  <Link
                    aria-label={`Previous project: ${previousProject.title}`}
                    to={projectResourceHref(previousProject.slug, resource)}
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" /> Previous
                  </Link>
                </Button>
              ) : (
                <Button disabled variant="outline">
                  <ArrowLeft aria-hidden="true" className="size-4" /> Previous
                </Button>
              )}
              {nextProject ? (
                <Button asChild variant="outline">
                  <Link
                    aria-label={`Next project: ${nextProject.title}`}
                    to={projectResourceHref(nextProject.slug, resource)}
                  >
                    Next <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button disabled variant="outline">
                  Next <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              )}
            </div>
          </nav>
          <ProjectResourceShell project={project} resource={resource}>
            {children}
          </ProjectResourceShell>
        </div>
      </article>
    </SiteLayout>
  );
}
