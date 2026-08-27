import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectDocsPage } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

export const Route = createFileRoute("/projects/$slug/docs/$pageId")({
  component: ProjectDocumentRoute,
});

function ProjectDocumentRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();
  const { pageId } = Route.useParams();
  return <ProjectDocsPage project={project} requestedPageId={pageId} />;
}
