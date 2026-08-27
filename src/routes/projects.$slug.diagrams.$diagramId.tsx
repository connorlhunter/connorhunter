import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectDiagramsPage } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

export const Route = createFileRoute("/projects/$slug/diagrams/$diagramId")({
  component: ProjectDiagramRoute,
});

function ProjectDiagramRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();
  const { diagramId } = Route.useParams();
  return <ProjectDiagramsPage project={project} requestedDiagramId={diagramId} />;
}
