import { afterEach, describe, expect, test } from "bun:test";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { clearPortfolioContentCache, getPortfolioContent } from "@/content";
import { routeTree } from "@/routeTree.gen";

describe("projects route nesting", () => {
  afterEach(() => {
    cleanup();
    clearPortfolioContentCache();
  });

  test("renders a project artifact viewer route instead of the projects grid", async () => {
    const content = await getPortfolioContent();
    const project = content.projects.find((item) =>
      item.artifacts.some((artifact) => artifact.label === "Docs"),
    );

    if (!project) {
      throw new Error("Expected at least one project with docs artifacts.");
    }

    const router = createRouter({
      history: createMemoryHistory({
        initialEntries: [`/projects/${project.slug}?viewer=docs`],
      }),
      routeTree,
      scrollRestoration: false,
    });

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const suppressTestingContainerWarning = (...args: Array<unknown>): boolean => {
      const message = args.map((arg) => String(arg)).join(" ");

      return message.includes("cannot be a child") && message.includes("<html>");
    };

    console.error = (...args: Array<unknown>) => {
      if (suppressTestingContainerWarning(...args)) return;
      originalConsoleError(...args);
    };
    console.warn = (...args: Array<unknown>) => {
      if (suppressTestingContainerWarning(...args)) return;
      originalConsoleWarn(...args);
    };

    try {
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("region", { name: `${project.title} Docs viewer` })).toBeTruthy();
      });

      expect(screen.queryByRole("heading", { level: 1, name: "Projects" })).toBeNull();
    } finally {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    }
  });
});
