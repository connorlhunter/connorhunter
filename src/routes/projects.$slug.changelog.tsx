import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProjectChangelogPage } from "@/features/projects/project-resource-pages";
import { Route as ProjectRoute } from "./projects.$slug";

export const Route = createFileRoute("/projects/$slug/changelog")({
  component: ProjectChangelogRoute,
});

function ProjectChangelogRoute(): ReactNode {
  const { project } = ProjectRoute.useLoaderData();
  return <ProjectChangelogPage project={project} />;
}
