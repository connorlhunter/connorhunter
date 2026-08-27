import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectOverview } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

/** Default overview for a project resource group. */
export const Route = createFileRoute("/projects/$slug/")({
  component: ProjectOverviewRoute,
});

function ProjectOverviewRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();

  return <ProjectOverview project={project} />;
}
