import type { ReactNode } from "react";
import { useLoaderData } from "@tanstack/react-router";
import { NotFoundPage } from "@/features/not-found/not-found-page";

/**
 * @returns The route-level not-found fallback inside the root document shell.
 */
export function RootNotFoundComponent(): ReactNode {
  const content = useLoaderData({ from: "__root__" });

  return <NotFoundPage content={content} />;
}
