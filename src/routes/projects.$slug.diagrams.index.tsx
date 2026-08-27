import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectDiagramsPage } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

/** Default diagram page for a project's diagram reader. */
export const Route = createFileRoute("/projects/$slug/diagrams/")({
  component: ProjectDiagramsRoute,
});

function ProjectDiagramsRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();

  return <ProjectDiagramsPage project={project} />;
}
