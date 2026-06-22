import type { ReactNode } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import { ProjectsPage } from "@/features/projects/project-showcase";
import { buildPageHead } from "@/lib/seo";

/**
 * @description Projects route backed by dynamic portfolio content.
 */
export const Route = createFileRoute("/projects")({
  loader: () => getPortfolioContent(),
  validateSearch: (search) => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  head: () =>
    buildPageHead(
      "Projects",
      "Selected portfolio projects with docs, diagrams, coverage, and architecture notes.",
      "/projects",
    ),
  component: ProjectsRoute,
});

/**
 * @returns The project listing, or the nested project route when a child match is active.
 */
function ProjectsRoute(): ReactNode {
  const content = Route.useLoaderData();
  const search = Route.useSearch();
  const childMatchCount = useChildMatches({
    select: (matches) => matches.length,
  });

  if (childMatchCount > 0) {
    return <Outlet />;
  }

  return <ProjectsPage content={content} selectedProjectSlug={search.project} />;
}
