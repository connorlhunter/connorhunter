import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import { ExperiencePage } from "@/features/experience/experience-page";
import { buildPageHead } from "@/lib/seo";

/**
 * @description Experience route backed by dynamic portfolio content.
 */
export const Route = createFileRoute("/experience")({
  loader: () => getPortfolioContent(),
  head: () =>
    buildPageHead(
      "Experience",
      "Professional experience, education, and certification background.",
      "/experience",
    ),
  component: ExperienceRoute,
});

/**
 * @returns The experience page with loaded portfolio content.
 */
function ExperienceRoute(): ReactNode {
  const content = Route.useLoaderData();

  return <ExperiencePage content={content} />;
}
