import type { ReactNode } from "react";
import { useLoaderData } from "@tanstack/react-router";
import { NotFoundPage } from "@/features/not-found/not-found-page";
import { RootDocument } from "./root-document";

/**
 * @returns The route-level not-found fallback inside the root document shell.
 */
export function RootNotFoundComponent(): ReactNode {
  const content = useLoaderData({ from: "__root__" });

  return (
    <RootDocument>
      <NotFoundPage content={content} />
    </RootDocument>
  );
}
