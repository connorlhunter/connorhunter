import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import { SkillsPage } from "@/features/skills/skills-page";
import { buildPageHead } from "@/lib/seo";

/**
 * @description Skills route backed by dynamic portfolio content.
 */
export const Route = createFileRoute("/skills")({
  loader: () => getPortfolioContent(),
  head: () =>
    buildPageHead("Skills", "Technical skills organized by engineering category.", "/skills"),
  component: SkillsRoute,
});

/**
 * @returns The skills page with loaded portfolio content.
 */
function SkillsRoute(): ReactNode {
  const content = Route.useLoaderData();

  return <SkillsPage content={content} />;
}
