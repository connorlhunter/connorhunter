import { notFound } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import type { PortfolioContent, Project } from "@/content/schema";

/** Loader payload shared by project overview and resource routes. */
export interface ProjectRouteData {
  readonly content: PortfolioContent;
  readonly project: Project;
}

/** Resolves project and shared shell data or returns the route not-found state. */
export async function loadProjectRouteData(slug: string): Promise<ProjectRouteData> {
  const content = await getPortfolioContent();
  const project = content.projects.find((item) => item.slug === slug);
  if (!project) throw notFound();
  return { content, project };
}
