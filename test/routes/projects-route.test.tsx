import { afterEach, describe, expect, mock, test } from "bun:test";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { mockContent } from "../mock-content";

mock.module("@/content", () => ({
  clearPortfolioContentCache: () => undefined,
  getPortfolioContent: () => Promise.resolve(mockContent),
  getProjectBySlug: async (slug: string) =>
    mockContent.projects.find((project) => project.slug === slug),
}));

const { routeTree } = await import("@/routeTree.gen");

describe("project routes", () => {
  afterEach(cleanup);

  test("redirects legacy viewer links to the native docs route", async () => {
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool?viewer=docs"] }),
      routeTree,
      scrollRestoration: false,
    });
    render(<RouterProvider router={router} />);

    await waitFor(() => expect(router.state.location.pathname).toBe("/projects/desktop-tool/docs"));
  });

  test("switches project resources through the client router", async () => {
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool"] }),
      routeTree,
      scrollRestoration: false,
    });
    render(<RouterProvider router={router} />);
    const projectNavigation = await screen.findByRole("navigation", {
      name: "Project navigation",
    });

    fireEvent.click(await screen.findByRole("link", { name: "Docs" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/projects/desktop-tool/docs"));
    expect(screen.getByRole("navigation", { name: "Project navigation" })).toBe(projectNavigation);
    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("aria-current")).toBe("page");

    fireEvent.click(screen.getByRole("link", { name: "Diagrams" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/projects/desktop-tool/diagrams"),
    );
    expect(screen.getByRole("link", { name: "Diagrams" }).getAttribute("aria-current")).toBe(
      "page",
    );

    fireEvent.click(screen.getByRole("link", { name: "Coverage" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/projects/desktop-tool/coverage"),
    );
    expect(screen.getByRole("link", { name: "Coverage" }).getAttribute("aria-current")).toBe(
      "page",
    );

    fireEvent.click(screen.getByRole("link", { name: "Changelog" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/projects/desktop-tool/changelog"),
    );
    expect(screen.getByRole("link", { name: "Changelog" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  test("moves to adjacent projects without leaving the active resource", async () => {
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool/docs"] }),
      routeTree,
      scrollRestoration: false,
    });
    render(<RouterProvider router={router} />);

    fireEvent.click(await screen.findByRole("link", { name: "Next project: Web Tool" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/projects/web-tool/docs"));

    fireEvent.click(await screen.findByRole("link", { name: "Previous project: Desktop Tool" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/projects/desktop-tool/docs"));
  });

  test("puts the changelog PDF action in the top reader rail", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_input) =>
      new Response("# Changelog\n\n## 1.0.0", { status: 200 })) as typeof fetch;

    try {
      const router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool/changelog"] }),
        routeTree,
        scrollRestoration: false,
      });
      render(<RouterProvider router={router} />);

      const download = await screen.findByRole("link", { name: "Download PDF" });
      expect(download.className).toContain("docs-reader-download--top");
      expect(download.closest(".docs-reader-sidebar-top")).not.toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("moves between documentation pages with the previous and next controls", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input) => {
      const href = String(input);
      const body = href.endsWith("/index.json")
        ? JSON.stringify({
            pages: [
              {
                id: "overview",
                lastUpdated: "2026-08-26",
                path: "pages/overview.md",
                section: "Desktop Tool",
                sourcePath: "docs/desktop-tool/overview.md",
                title: "Overview",
                version: "1.0.0",
              },
              {
                id: "detail",
                lastUpdated: "2026-08-26",
                path: "pages/detail.md",
                section: "Desktop Tool",
                sourcePath: "docs/desktop-tool/detail.md",
                title: "Detail",
                version: "1.0.0",
              },
            ],
            schemaVersion: 2,
            title: "Desktop Tool",
          })
        : href.endsWith("/pages/detail.md")
          ? "# Detail\n\nSecond page."
          : "# Overview\n\nFirst page.";

      return new Response(body, { status: 200 });
    }) as typeof fetch;

    try {
      const router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool/docs"] }),
        routeTree,
        scrollRestoration: false,
      });
      render(<RouterProvider router={router} />);

      expect(await screen.findByRole("link", { name: "Download PDF" })).toBeTruthy();
      fireEvent.click(await screen.findByRole("link", { name: "Next: Detail" }));
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/projects/desktop-tool/docs/detail"),
      );
      expect(await screen.findByRole("link", { name: "Previous: Overview" })).toBeTruthy();

      fireEvent.click(screen.getByRole("link", { name: "Previous: Overview" }));
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/projects/desktop-tool/docs/overview"),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
