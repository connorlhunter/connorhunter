import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import type { ArtifactLink, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { DownloadActions, ProjectLinkActions } from "./project-actions";
import { artifact } from "./project-resource-shared";
import { projectResourceHref, type ProjectResourceKind } from "./project-resource-routes";

function resourceTitle(resource: ProjectResourceKind): string {
  if (resource === "docs") return "Docs";
  if (resource === "diagrams") return "Diagrams";
  if (resource === "coverage") return "Coverage";
  if (resource === "changelog") return "Changelog";
  return "Overview";
}

/** Project header and resource navigation shared by every project route. */
export function ProjectResourceShell({
  children,
  project,
  resource,
}: {
  readonly children: ReactNode;
  readonly project: Project;
  readonly resource: ProjectResourceKind;
}): ReactNode {
  return (
    <article className="project-page">
      <header className="project-hero">
        <div className="project-hero-copy">
          <div className="project-hero-title">
            <ThemedIconImage
              alt=""
              aria-hidden="true"
              className="project-hero-icon"
              src={project.icon}
            />
            <TypographyH1 className="project-hero-heading">{project.title}</TypographyH1>
          </div>
          <TypographyMuted className="project-hero-summary mt-3">{project.summary}</TypographyMuted>
        </div>
        <div className="project-hero-actions">
          <ProjectLinkActions links={project.links} liveVariant="secondary" />
          <DownloadActions downloads={project.downloads} />
        </div>
      </header>

      <nav aria-label={`${project.title} resources`} className="project-resource-nav">
        {(["overview", "docs", "diagrams", "coverage", "changelog"] as const).map((item) => {
          const unavailable =
            item !== "overview" &&
            artifact(project, resourceTitle(item) as ArtifactLink["label"])?.comingSoon;
          return unavailable ? (
            <span aria-disabled="true" className="project-resource-nav-item" key={item}>
              {resourceTitle(item)}
            </span>
          ) : (
            <Link
              activeOptions={{ exact: true }}
              aria-current={item === resource ? "page" : undefined}
              className="project-resource-nav-item"
              key={item}
              to={projectResourceHref(project.slug, item)}
            >
              {resourceTitle(item)}
            </Link>
          );
        })}
      </nav>
      {children}
    </article>
  );
}
