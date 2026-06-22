import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import { HomePage } from "@/features/home/home-page";
import { buildHomeHead, buildPageHead } from "@/lib/seo";

/**
 * @description Home route backed by dynamic portfolio content.
 */
export const Route = createFileRoute("/")({
  loader: () => getPortfolioContent(),
  head: ({ loaderData }) =>
    loaderData
      ? buildHomeHead(loaderData)
      : buildPageHead(
          "Home",
          "Full-stack software engineering portfolio and project artifacts.",
          "/",
        ),
  component: HomeRoute,
});

/**
 * @returns The home page with loaded portfolio content.
 */
function HomeRoute(): ReactNode {
  const content = Route.useLoaderData();

  return <HomePage content={content} />;
}
