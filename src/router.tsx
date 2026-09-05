import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * @returns A TanStack Router instance for the generated route tree.
 */
export function getRouter(): ReturnType<typeof createRouter> {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
