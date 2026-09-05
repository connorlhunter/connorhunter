import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { PortfolioContent, Project } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";
import { ProjectResourceShell } from "./project-resource-shell";
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
          <nav aria-label="Project navigation" className="project-detail-navigation mb-5">
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
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Link>
                </Button>
              ) : (
                <Button aria-label="Previous project" disabled variant="outline">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              )}
              {nextProject ? (
                <Button asChild variant="outline">
                  <Link
                    aria-label={`Next project: ${nextProject.title}`}
                    to={projectResourceHref(nextProject.slug, resource)}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button aria-label="Next project" disabled variant="outline">
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
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
