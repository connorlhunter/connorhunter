import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectCoveragePage } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

export const Route = createFileRoute("/projects/$slug/coverage")({
  component: ProjectCoverageRoute,
});

function ProjectCoverageRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();
  return <ProjectCoveragePage project={project} />;
}
