import type { ReactNode } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPortfolioContent, getProjectBySlug } from "@/content";
import type { PortfolioContent } from "@/content/schema";
import type { Project } from "@/content/schema";
import { ProjectDetailPage } from "@/features/projects/project-detail-page";
import { parseProjectViewerKind } from "@/features/projects/project-viewer-model";
import { buildPageHead, buildProjectHead } from "@/lib/seo";

/**
 * @property content - Complete portfolio content for the shared shell.
 * @property project - Project matched by the route slug.
 */
export interface ProjectLoaderData {
  readonly content: PortfolioContent;
  readonly project: Project;
}

/**
 * @param slug - Project slug from the route params.
 * @returns Loader data for the project detail route.
 */
async function loadProject(slug: string): Promise<ProjectLoaderData> {
  const [content, project] = await Promise.all([getPortfolioContent(), getProjectBySlug(slug)]);

  if (!project) {
    throw notFound();
  }

  return { content, project };
}

/**
 * @description Project detail route backed by dynamic project content.
 */
export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => loadProject(params.slug),
  validateSearch: (search) => ({
    diagram: typeof search.diagram === "string" ? search.diagram : undefined,
    viewer: parseProjectViewerKind(search.viewer),
  }),
  head: ({ loaderData, params }) =>
    loaderData
      ? buildProjectHead(loaderData.project)
      : buildPageHead("Project", `Project details for ${params.slug}.`, `/projects/${params.slug}`),
  component: ProjectRoute,
});

/**
 * @returns The project detail page for the active slug and viewer search params.
 */
function ProjectRoute(): ReactNode {
  const { content, project } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <ProjectDetailPage
      content={content}
      diagram={search.diagram}
      project={project}
      viewer={search.viewer}
    />
  );
}
