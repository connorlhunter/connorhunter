import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ProjectDetailPage } from "@/features/projects/project-detail-page";
import { wireDocsDiagramLinks } from "@/features/projects/project-resource-viewer";
import {
  parseProjectViewerKind,
  projectDetailViewerHref,
} from "@/features/projects/project-viewer-model";
import { mockContent, projectWithDownloads, projectWithoutDownloads } from "../../mock-content";

function setMeasuredHeight(element: HTMLElement, height: number): void {
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height,
  });
  element.getBoundingClientRect = () =>
    (() => {
      const styledHeight = Number.parseFloat(element.style.height);
      const measuredHeight = Number.isFinite(styledHeight) ? styledHeight : height;

      return {
        bottom: measuredHeight,
        height: measuredHeight,
        left: 0,
        right: 0,
        top: 0,
        width: 640,
        x: 0,
        y: 0,
      } as DOMRect;
    })();
}

function setSectionMetrics(element: HTMLElement, offsetTop: number, height: number): void {
  Object.defineProperty(element, "offsetTop", {
    configurable: true,
    get: () => offsetTop,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height,
  });
}

describe("ProjectDetailPage", () => {
  test("renders semantic project detail content and icon-backed resources", () => {
    render(<ProjectDetailPage content={mockContent} project={projectWithDownloads} />);

    expect(screen.getByRole("heading", { level: 1, name: "Desktop Tool" })).toBeTruthy();
    expect(document.querySelector(".project-detail-panel")).toBeTruthy();
    expect(document.querySelector(".file-viewer-shell--content")).toBeTruthy();
    expect(
      document
        .querySelector(".file-viewer-frame-wrap")
        ?.classList.contains("file-viewer-content-wrap"),
    ).toBe(true);
    expect(document.querySelector(".project-asset-icon")).toBeTruthy();
    expect(document.querySelector(".file-viewer-toolbar")).toBeNull();
    expect(document.querySelector(".file-viewer-project-icon")).toBeNull();
    const projectNavigation = screen.getByRole("navigation", { name: "Project navigation" });
    const projectHeader = document.querySelector(".project-detail-header") as HTMLElement;
    expect(
      within(projectNavigation).getByRole("link", { name: "Projects" }).getAttribute("href"),
    ).toBe("/projects");
    expect(within(projectHeader).getByRole("button", { name: "Next" })).toBeTruthy();
    expect(within(projectHeader).getByRole("button", { name: "Full screen" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Desktop Tool viewer controls" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse viewer drawer" })).toBeTruthy();
    expect(
      within(projectHeader).getByRole("group", { name: "Desktop Tool viewer actions" }),
    ).toBeTruthy();
    const drawerControls = screen.getByRole("group", { name: "Desktop Tool viewer controls" });
    const projectActions = within(drawerControls).getByRole("group", {
      name: "Desktop Tool project actions",
    });
    const stack = within(drawerControls).getByRole("group", {
      name: "Desktop Tool stack",
    });
    expect(within(projectActions).getByRole("link", { name: "Open" })).toBeTruthy();
    expect(within(projectActions).getByRole("link", { name: "Roadmap" })).toBeTruthy();
    const desktopDownloads = within(drawerControls).getByRole("group", {
      name: "Desktop Tool desktop downloads",
    });
    const resourceViews = within(drawerControls).getByRole("group", {
      name: "Desktop Tool resource views",
    });
    expect(stack.compareDocumentPosition(projectActions)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(projectActions.parentElement).toBe(desktopDownloads.parentElement);
    expect(projectActions.compareDocumentPosition(desktopDownloads)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(projectActions.compareDocumentPosition(resourceViews)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(desktopDownloads.compareDocumentPosition(resourceViews)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.queryByText("Project Actions")).toBeNull();
    expect(screen.getByText("Generic project notes body.")).toBeTruthy();
    expect(within(resourceViews).getByText("Docs")).toBeTruthy();
    expect(within(resourceViews).getByText("Coverage")).toBeTruthy();
    expect(within(resourceViews).getByText("Diagrams")).toBeTruthy();
    expect(within(desktopDownloads).getByText("Mac")).toBeTruthy();
    expect(within(desktopDownloads).getByText("Windows")).toBeTruthy();
    expect(within(desktopDownloads).getByRole("link", { name: "Mac coming soon" })).toBeTruthy();
    expect(
      within(desktopDownloads).getByRole("link", { name: "Windows coming soon" }),
    ).toBeTruthy();
    expect(document.querySelector(".project-viewer-related")).toBeNull();

    cleanup();
  });

  test("collapses the project title and desktop viewer actions after drawer sections", () => {
    window.sessionStorage.removeItem(
      "connorhunter.file-viewer-drawer.project-resource-viewer:desktop",
    );
    render(<ProjectDetailPage content={mockContent} project={projectWithDownloads} />);

    const header = document.querySelector(".project-detail-header") as HTMLElement;
    const drawer = screen.getByRole("group", { name: "Desktop Tool viewer controls" });
    const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");

    setMeasuredHeight(drawer, 180);
    setSectionMetrics(sections[0] as HTMLElement, 0, 72);
    setSectionMetrics(sections[1] as HTMLElement, 72, 56);
    setSectionMetrics(sections[2] as HTMLElement, 128, 52);

    fireEvent.click(handle);
    fireEvent.click(handle);
    fireEvent.click(handle);
    fireEvent.click(handle);

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
    expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");

    cleanup();
  });

  test("collapses mobile viewer actions before the project title section", async () => {
    const originalMatchMedia = window.matchMedia;

    window.matchMedia = (query: string): MediaQueryList => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: query === "(max-width: 1023px)" || query === "(max-width: 860px)",
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    });
    window.sessionStorage.removeItem(
      "connorhunter.file-viewer-drawer.project-resource-viewer:mobile",
    );

    try {
      render(<ProjectDetailPage content={mockContent} project={projectWithDownloads} />);

      const header = document.querySelector(".project-detail-header") as HTMLElement;
      const drawer = screen.getByRole("group", { name: "Desktop Tool viewer controls" });
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");
      const viewerActions = await waitFor(() =>
        within(drawer).getByRole("group", {
          name: "Desktop Tool viewer actions",
        }),
      );

      setMeasuredHeight(drawer, 260);
      sections.forEach((section, index) => {
        setSectionMetrics(section, index * 52, 52);
      });

      expect(viewerActions.parentElement?.hasAttribute("data-file-viewer-drawer-section")).toBe(
        true,
      );

      for (let index = 0; index < sections.length; index += 1) {
        fireEvent.click(handle);
      }

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);

      fireEvent.click(handle);

      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
    } finally {
      cleanup();
      window.matchMedia = originalMatchMedia;
    }
  });

  test("moves viewer actions into their own drawer section on mobile", async () => {
    const originalMatchMedia = window.matchMedia;

    window.matchMedia = (query: string): MediaQueryList => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: query === "(max-width: 1023px)",
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    });

    try {
      render(<ProjectDetailPage content={mockContent} project={projectWithDownloads} />);

      const projectHeader = document.querySelector(".project-detail-header") as HTMLElement;
      const drawerControls = screen.getByRole("group", { name: "Desktop Tool viewer controls" });
      const resourceViews = within(drawerControls).getByRole("group", {
        name: "Desktop Tool resource views",
      });
      const projectActions = within(drawerControls).getByRole("group", {
        name: "Desktop Tool project actions",
      });
      const desktopDownloads = within(drawerControls).getByRole("group", {
        name: "Desktop Tool desktop downloads",
      });
      const viewerActions = await waitFor(() =>
        within(drawerControls).getByRole("group", {
          name: "Desktop Tool viewer actions",
        }),
      );

      expect(
        within(projectHeader).queryByRole("group", { name: "Desktop Tool viewer actions" }),
      ).toBeNull();
      expect(
        viewerActions.parentElement?.classList.contains("project-detail-drawer-viewer-actions"),
      ).toBe(true);
      expect(projectActions.parentElement).not.toBe(desktopDownloads.parentElement);
      expect(projectActions.parentElement?.hasAttribute("data-file-viewer-drawer-section")).toBe(
        true,
      );
      expect(desktopDownloads.parentElement?.hasAttribute("data-file-viewer-drawer-section")).toBe(
        true,
      );
      expect(
        desktopDownloads.parentElement?.classList.contains(
          "project-detail-mobile-action-section--separated",
        ),
      ).toBe(true);
      expect(viewerActions.compareDocumentPosition(resourceViews)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    } finally {
      cleanup();
      window.matchMedia = originalMatchMedia;
    }
  });

  test("omits live and download sections when unavailable", () => {
    render(<ProjectDetailPage content={mockContent} project={projectWithoutDownloads} />);

    expect(screen.queryByText("Open")).toBeNull();
    expect(screen.queryByText("Desktop Downloads")).toBeNull();
    expect(screen.queryByRole("group", { name: "Web Tool desktop downloads" })).toBeNull();

    cleanup();
  });

  test("renders artifact viewers in the shared file viewer shell", () => {
    render(
      <ProjectDetailPage content={mockContent} project={projectWithDownloads} viewer="docs" />,
    );
    const viewer = screen.getByRole("region", { name: "Desktop Tool Docs viewer" });
    const viewerActions = viewer.querySelector(".file-viewer-actions") as HTMLElement;
    const frame = screen.getByTitle("Desktop Tool Docs");

    expect(frame.getAttribute("src")).toContain("docs/example/index.html");
    expect(
      within(viewerActions).getByRole("link", { name: "Open" }).getAttribute("href"),
    ).toContain("docs/example/index.html");
    expect(within(viewer).getByRole("button", { name: "Next" })).toBeTruthy();
    expect(() => {
      fireEvent.load(frame);
    }).not.toThrow();

    cleanup();
  });

  test("switches resource tabs in place so viewer state can persist", () => {
    const originalPushState = window.history.pushState;
    const pushStates: Array<string | URL | null | undefined> = [];
    window.history.pushState = ((_state, _title, url) => {
      pushStates.push(url);
    }) as typeof window.history.pushState;

    try {
      render(<ProjectDetailPage content={mockContent} project={projectWithDownloads} />);

      const drawerControls = screen.getByRole("group", { name: "Desktop Tool viewer controls" });
      const resourceViews = within(drawerControls).getByRole("group", {
        name: "Desktop Tool resource views",
      });
      const docsLink = within(resourceViews).getByRole("link", { name: "Docs" });

      expect(fireEvent.click(docsLink)).toBe(false);
      expect(pushStates).toEqual(["/projects/desktop-tool?viewer=docs#project-viewer"]);
    } finally {
      cleanup();
      window.history.pushState = originalPushState;
    }
  });

  test("leaves modified and non-self resource tab clicks to the browser", () => {
    const originalPushState = window.history.pushState;
    const pushStates: Array<string | URL | null | undefined> = [];
    window.history.pushState = ((_state, _title, url) => {
      pushStates.push(url);
    }) as typeof window.history.pushState;

    try {
      render(<ProjectDetailPage content={mockContent} project={projectWithDownloads} />);

      const drawerControls = screen.getByRole("group", { name: "Desktop Tool viewer controls" });
      const resourceViews = within(drawerControls).getByRole("group", {
        name: "Desktop Tool resource views",
      });
      const docsLink = within(resourceViews).getByRole("link", { name: "Docs" });

      expect(fireEvent.click(docsLink, { ctrlKey: true })).toBe(true);

      docsLink.setAttribute("target", "_blank");
      expect(fireEvent.click(docsLink)).toBe(true);
      expect(pushStates).toEqual([]);
    } finally {
      cleanup();
      window.history.pushState = originalPushState;
    }
  });

  test("renders every diagram and selects the requested diagram", () => {
    const originalPushState = window.history.pushState;
    const pushStates: Array<string | URL | null | undefined> = [];
    window.history.pushState = ((_state, _title, url) => {
      pushStates.push(url);
    }) as typeof window.history.pushState;

    try {
      render(
        <ProjectDetailPage
          content={mockContent}
          diagram="detail"
          project={projectWithDownloads}
          viewer="diagrams"
        />,
      );
      const diagramNavigation = screen.getByRole("navigation", { name: "Desktop Tool diagrams" });
      const overviewLink = within(diagramNavigation).getByRole("link", { name: "Overview" });

      expect(overviewLink).toBeTruthy();
      expect(
        within(diagramNavigation).getByRole("link", { name: "Detail" }).getAttribute("href"),
      ).toBe("/projects/desktop-tool?viewer=diagrams&diagram=detail#project-viewer");
      expect(screen.getByTitle("Desktop Tool Detail").getAttribute("src")).toContain(
        "diagrams/example/example-detail.svg",
      );

      fireEvent.click(overviewLink);

      expect(pushStates).toEqual([
        "/projects/desktop-tool?viewer=diagrams&diagram=overview#project-viewer",
      ]);
    } finally {
      cleanup();
      window.history.pushState = originalPushState;
    }
  });

  test("falls back to the overview diagram when no diagram item list exists", () => {
    render(
      <ProjectDetailPage
        content={mockContent}
        project={{
          ...projectWithDownloads,
          artifacts: projectWithDownloads.artifacts.map((artifact) =>
            artifact.label === "Diagrams"
              ? { href: artifact.href, label: artifact.label }
              : artifact,
          ),
        }}
        viewer="diagrams"
      />,
    );

    expect(screen.queryByRole("navigation", { name: "Desktop Tool diagrams" })).toBeNull();
    expect(screen.getByTitle("Desktop Tool Overview").getAttribute("src")).toContain(
      "diagrams/example/example-overview.svg",
    );

    cleanup();
  });

  test("keeps coming soon coverage disabled instead of opening a viewer", () => {
    render(
      <ProjectDetailPage
        content={mockContent}
        project={{
          ...projectWithDownloads,
          artifacts: projectWithDownloads.artifacts.map((artifact) =>
            artifact.label === "Coverage" ? { ...artifact, comingSoon: true } : artifact,
          ),
        }}
        viewer="coverage"
      />,
    );

    expect(screen.getByRole("region", { name: "Desktop Tool Project viewer" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coverage coming soon" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2, name: "Coming soon" })).toBeNull();
    expect(screen.queryByTitle("Desktop Tool Coverage")).toBeNull();
    expect(screen.getByText("Generic project notes body.")).toBeTruthy();

    cleanup();
  });

  test("renders coverage in the shared file viewer shell with open and download actions", () => {
    render(
      <ProjectDetailPage content={mockContent} project={projectWithDownloads} viewer="coverage" />,
    );
    const viewer = screen.getByRole("region", { name: "Desktop Tool Coverage viewer" });
    const viewerActions = viewer.querySelector(".file-viewer-actions") as HTMLElement;

    expect(screen.getByTitle("Desktop Tool Coverage").getAttribute("src")).toContain(
      "projects/example/coverage/index.html",
    );
    expect(
      within(viewerActions).getByRole("link", { name: "Open" }).getAttribute("href"),
    ).toContain("projects/example/coverage/index.html");
    expect(
      within(viewerActions).getByRole("link", { name: "Download" }).getAttribute("href"),
    ).toContain("projects/example/coverage/index.html");
    expect(
      within(viewerActions).getByRole("link", { name: "Email" }).getAttribute("href"),
    ).toContain("mailto:example@example.com");

    cleanup();
  });

  test("renders a missing artifact state inside the shared viewer", () => {
    render(
      <ProjectDetailPage
        content={mockContent}
        project={{
          ...projectWithDownloads,
          artifacts: projectWithDownloads.artifacts.filter(
            (artifact) => artifact.label !== "Diagrams",
          ),
        }}
        viewer="diagrams"
      />,
    );

    expect(screen.getByRole("region", { name: "Desktop Tool Diagrams viewer" })).toBeTruthy();
    const heading = screen.getByRole("heading", { level: 2, name: "Diagrams not found" });

    expect(heading.closest(".not-found-panel")).toBeTruthy();
    expect(heading.closest(".project-viewer-empty")).toBeTruthy();
    expect(
      screen.getByText(
        "Desktop Tool does not have a diagrams artifact configured for this viewer yet.",
      ),
    ).toBeTruthy();

    cleanup();
  });

  test("parses supported project viewer search params only", () => {
    expect(parseProjectViewerKind("docs")).toBe("docs");
    expect(parseProjectViewerKind("missing")).toBeUndefined();
    expect(parseProjectViewerKind(42)).toBeUndefined();
    expect(projectDetailViewerHref("desktop-tool", "diagrams", { diagram: "detail" })).toBe(
      "/projects/desktop-tool?viewer=diagrams&diagram=detail#project-viewer",
    );
  });

  test("bridges same-origin docs diagram links to the diagrams viewer", () => {
    let clickHandler: ((event: MouseEvent) => void) | undefined;
    const frame = {} as HTMLIFrameElement;
    const frameDocument = {
      body: {
        addEventListener: (_eventName: string, handler: EventListener) => {
          clickHandler = handler as (event: MouseEvent) => void;
        },
      },
    } as Document;
    const navigations: Array<string> = [];

    Object.defineProperty(frame, "contentDocument", {
      configurable: true,
      get: () => frameDocument,
    });

    wireDocsDiagramLinks(frame, "/projects/example?viewer=diagrams#project-viewer", (href) => {
      navigations.push(href);
    });

    if (!clickHandler) {
      throw new Error("Expected docs click handler.");
    }

    let docPrevented = false;
    clickHandler({
      preventDefault: () => {
        docPrevented = true;
      },
      target: {
        getAttribute: () => "docs/example.html",
        nodeType: 1,
        parentElement: null,
        tagName: "A",
      },
    } as unknown as MouseEvent);
    expect(docPrevented).toBe(false);

    let nonLinkPrevented = false;
    clickHandler({
      preventDefault: () => {
        nonLinkPrevented = true;
      },
      target: {
        nodeType: 1,
        parentElement: null,
        tagName: "SPAN",
      },
    } as unknown as MouseEvent);
    expect(nonLinkPrevented).toBe(false);

    let diagramPrevented = false;
    clickHandler({
      preventDefault: () => {
        diagramPrevented = true;
      },
      target: {
        getAttribute: () => "",
        nodeType: 1,
        parentElement: {
          getAttribute: () => "diagrams/example.html",
          nodeType: 1,
          parentElement: null,
          tagName: "A",
        },
        tagName: "SPAN",
      },
    } as unknown as MouseEvent);
    expect(diagramPrevented).toBe(true);
    expect(navigations).toEqual(["/projects/example?viewer=diagrams#project-viewer"]);
  });

  test("navigates docs diagram links in place by default", () => {
    let clickHandler: ((event: MouseEvent) => void) | undefined;
    const frame = {} as HTMLIFrameElement;
    const frameDocument = {
      body: {
        addEventListener: (_eventName: string, handler: EventListener) => {
          clickHandler = handler as (event: MouseEvent) => void;
        },
      },
    } as Document;
    const originalPushState = window.history.pushState;
    const diagramsHref = "/projects/example?viewer=diagrams#project-viewer";
    const pushStates: Array<string | URL | null | undefined> = [];
    window.history.pushState = ((_state, _title, url) => {
      pushStates.push(url);
    }) as typeof window.history.pushState;

    Object.defineProperty(frame, "contentDocument", {
      configurable: true,
      get: () => frameDocument,
    });

    try {
      wireDocsDiagramLinks(frame, diagramsHref);

      if (!clickHandler) {
        throw new Error("Expected docs click handler.");
      }

      clickHandler({
        preventDefault: () => undefined,
        target: {
          getAttribute: () => "diagrams/example.html",
          nodeType: 1,
          parentElement: null,
          tagName: "A",
        },
      } as unknown as MouseEvent);

      expect(pushStates).toEqual([diagramsHref]);
    } finally {
      window.history.pushState = originalPushState;
    }
  });

  test("ignores inaccessible docs frames while wiring diagram links", () => {
    const frame = document.createElement("iframe");

    Object.defineProperty(frame, "contentDocument", {
      configurable: true,
      get: () => {
        throw new Error("Cross-origin frame.");
      },
    });

    expect(() => {
      wireDocsDiagramLinks(frame, "/projects/example?viewer=diagrams#project-viewer");
    }).not.toThrow();
  });
});
