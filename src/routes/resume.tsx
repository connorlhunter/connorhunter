import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import { ResumePage } from "@/features/resume/resume-page";
import { buildPageHead } from "@/lib/seo";

/**
 * @description Resume route backed by dynamic portfolio content.
 */
export const Route = createFileRoute("/resume")({
  loader: () => getPortfolioContent(),
  head: () =>
    buildPageHead("Resume", "PDF resume viewer with download and contact actions.", "/resume"),
  component: ResumeRoute,
});

/**
 * @returns The resume viewer page with loaded portfolio content.
 */
function ResumeRoute(): ReactNode {
  const content = Route.useLoaderData();

  return <ResumePage content={content} />;
}
