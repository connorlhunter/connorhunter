import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectDocsPage } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

/** Default document page for a project's documentation reader. */
export const Route = createFileRoute("/projects/$slug/docs/")({
  component: ProjectDocsRoute,
});

function ProjectDocsRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();

  return <ProjectDocsPage project={project} />;
}
