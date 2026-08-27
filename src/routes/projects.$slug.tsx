import type { ReactNode } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/features/projects/project-detail-page";
import { loadProjectRouteData } from "@/features/projects/project-route-data";
import {
  projectResourceHref,
  type ProjectResourceKind,
} from "@/features/projects/project-resource-routes";
import { buildPageHead, buildProjectHead } from "@/lib/seo";

/** Project resource route parent with redirects for legacy query-string viewer links. */
export const Route = createFileRoute("/projects/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    diagram: typeof search.diagram === "string" ? search.diagram : undefined,
    viewer: typeof search.viewer === "string" ? search.viewer : undefined,
  }),
  beforeLoad: ({ params, search }) => {
    const value = typeof search.viewer === "string" ? search.viewer : undefined;
    if (!value || value === "project") return;
    const resource: ProjectResourceKind | undefined =
      value === "docs" || value === "diagrams" || value === "coverage" ? value : undefined;
    if (!resource) return;
    const itemId =
      resource === "diagrams" && typeof search.diagram === "string" ? search.diagram : undefined;
    throw redirect({ to: projectResourceHref(params.slug, resource, itemId), replace: true });
  },
  loader: ({ params }) => loadProjectRouteData(params.slug),
  head: ({ loaderData, params }) =>
    loaderData
      ? buildProjectHead(loaderData.project)
      : buildPageHead("Project", `Project details for ${params.slug}.`, `/projects/${params.slug}`),
  component: ProjectRouteLayout,
});

function ProjectRouteLayout(): ReactNode {
  const { content, project } = Route.useLoaderData();

  return (
    <ProjectDetailPage content={content} project={project}>
      <Outlet />
    </ProjectDetailPage>
  );
}
