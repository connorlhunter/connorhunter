import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import {
  defaultDarkThemeScheme,
  defaultLightThemeScheme,
  themeStorageKey,
  themeCookieName,
} from "@/features/theme/theme";
import { mockContent } from "../mock-content";

const loadContent = mock(() => Promise.resolve(mockContent));
const clearContentCache = mock(() => undefined);
mock.module("@/content", () => ({
  clearPortfolioContentCache: clearContentCache,
  getPortfolioContent: loadContent,
}));

const { routeTree } = await import("@/routeTree.gen");

describe("project routes", () => {
  afterEach(() => {
    cleanup();
    loadContent.mockReset().mockImplementation(() => Promise.resolve(mockContent));
    clearContentCache.mockClear();
  });

  test("renders unknown routes inside the themed document shell", async () => {
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/missing-page"] }),
      routeTree,
      scrollRestoration: false,
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
    expect(screen.getByRole("banner")).toBeTruthy();
  });

  test("retries a failed root loader with a cleared content cache", async () => {
    loadContent.mockRejectedValue(new Error("Content unavailable"));
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/projects"] }),
      routeTree,
      scrollRestoration: false,
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeTruthy();
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    expect(themeMeta).toBeTruthy();
    loadContent.mockResolvedValue(mockContent);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Something went wrong" })).toBeNull(),
    );
    expect(clearContentCache).toHaveBeenCalledTimes(1);
    expect(document.querySelector('meta[name="theme-color"]')).toBe(themeMeta);
    expect(await screen.findByRole("heading", { name: "Projects", level: 1 })).toBeTruthy();
  });

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

  test("keeps page and browser chrome in sync across navigation with persistence blocked", async () => {
    window.localStorage.removeItem(themeStorageKey);
    document.cookie = `${themeCookieName}=; Path=/; Max-Age=0`;
    const cookie = Object.getOwnPropertyDescriptor(document, "cookie");
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "",
      set: () => {},
    });
    const writeStorage = spyOn(window.localStorage, "setItem").mockImplementation(() => {});
    try {
      const router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool"] }),
        routeTree,
        scrollRestoration: false,
      });
      render(<RouterProvider router={router} />);
      fireEvent.click(await screen.findByRole("button", { name: "Switch to dark theme" }));
      fireEvent.click(
        within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", {
          name: "Skills",
        }),
      );
      await waitFor(() => expect(router.state.location.pathname).toBe("/skills"));
      expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
      for (const to of ["/skills", "/projects/desktop-tool/diagrams"] as const) {
        await act(async () => {
          await router.navigate({ to });
        });
        expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
        expect(document.documentElement.dataset.scheme).toBe("midnight");
        expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
        expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(
          defaultDarkThemeScheme.themeColor,
        );
        expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute("content")).toBe(
          "dark",
        );
      }
      act(() => {
        window.dispatchEvent(new window.Event("pageshow"));
      });
      expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
      await act(async () => {
        await router.invalidate();
      });
      expect(document.documentElement.dataset.scheme).toBe("atlas");
      expect(document.documentElement.style.colorScheme).toBe("light");
      expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(
        defaultLightThemeScheme.themeColor,
      );
      expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute("content")).toBe(
        "light",
      );
    } finally {
      cleanup();
      writeStorage.mockRestore();
      if (cookie) Object.defineProperty(document, "cookie", cookie);
      else Reflect.deleteProperty(document, "cookie");
    }
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

  test("retries a failed resource without leaving the page", async () => {
    const originalFetch = globalThis.fetch;
    let available = false;
    globalThis.fetch = (async (_input) =>
      available
        ? new Response("# Changelog\n\nRecovered release notes.")
        : new Response("Unavailable", { status: 503 })) as typeof fetch;
    try {
      const router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/projects/desktop-tool/changelog"] }),
        routeTree,
        scrollRestoration: false,
      });
      render(<RouterProvider router={router} />);
      const retry = await screen.findByRole("button", { name: "Try again" });
      available = true;
      fireEvent.click(retry);
      expect(await screen.findByText("Recovered release notes.")).toBeTruthy();
      expect(router.state.location.pathname).toBe("/projects/desktop-tool/changelog");
    } finally {
      globalThis.fetch = originalFetch;
    }
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
