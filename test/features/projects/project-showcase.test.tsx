import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  ArtifactActions,
  DownloadActions,
  ProjectLinkActions,
} from "@/features/projects/project-actions";
import { ProjectShowcase, ProjectsPage } from "@/features/projects/project-showcase";
import { mockContent, projectWithDownloads, projectWithoutDownloads } from "../../mock-content";

describe("ProjectShowcase", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders artifacts, links, hash targets, and desktop downloads only when present", () => {
    render(<ProjectShowcase projects={[projectWithDownloads, projectWithoutDownloads]} />);

    expect(screen.getByText("Desktop Tool")).toBeTruthy();
    expect(screen.getByText("Web Tool")).toBeTruthy();
    expect(document.querySelectorAll(".project-asset-icon")).toHaveLength(2);
    expect(document.getElementById("desktop-tool")).toBeTruthy();
    expect(document.getElementById("web-tool")).toBeTruthy();
    expect(document.getElementById("desktop-tool")?.querySelector(".project-notes-bottom")).toBe(
      null,
    );
    expect(
      document.getElementById("web-tool")?.querySelector(".project-notes-bottom"),
    ).toBeTruthy();
    expect(screen.getAllByText("Docs")).toHaveLength(2);
    expect(screen.getAllByText("Coverage")).toHaveLength(2);
    expect(screen.getAllByText("Diagrams")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Docs" })[0]?.getAttribute("href")).toBe(
      "/projects/desktop-tool?viewer=docs#project-viewer",
    );
    expect(screen.getAllByRole("link", { name: "Diagrams" })[0]?.getAttribute("href")).toBe(
      "/projects/desktop-tool?viewer=diagrams#project-viewer",
    );
    expect(screen.getAllByRole("link", { name: "Coverage" })[0]?.getAttribute("href")).toBe(
      "/projects/desktop-tool?viewer=coverage#project-viewer",
    );
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.queryByText("Details")).toBeNull();
    expect(screen.getAllByText("Project notes")).toHaveLength(2);
    const notesButtons = screen.getAllByRole("button", { name: /project notes/i });
    expect(notesButtons).toHaveLength(2);
    expect(notesButtons[0]?.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(notesButtons[0] as HTMLElement);
    expect(notesButtons[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector(".project-notes-companion-space")).toBeNull();
    fireEvent.click(notesButtons[1] as HTMLElement);
    expect(notesButtons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(notesButtons[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByText("Problem")).toHaveLength(2);
    expect(screen.getAllByText("Architecture")).toHaveLength(2);
    expect(screen.getAllByText("Notes")).toHaveLength(2);
    expect(screen.getAllByText("Generic project notes body.")).toHaveLength(2);
    expect(screen.getAllByText("Source")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Source coming soon" })).toBeTruthy();
    expect(screen.getAllByText("Roadmap")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Roadmap" })[0]?.getAttribute("target")).toBe(
      "_blank",
    );
    expect(screen.getByText("Desktop Downloads")).toBeTruthy();
    expect(screen.getByText("Mac")).toBeTruthy();
    expect(screen.getByText("Windows")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Mac coming soon" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Windows coming soon" })).toBeTruthy();
  });

  test("renders the full projects page shell", () => {
    render(<ProjectsPage content={mockContent} />);

    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeTruthy();
    expect(screen.getByText("Example projects page.")).toBeTruthy();
  });

  test("scrolls to a selected project card without rendering a viewer on the projects page", () => {
    let requestAnimationFrameCalled = false;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalScrollIntoView = window.Element.prototype.scrollIntoView;
    const scrollTargets: Array<string> = [];

    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      requestAnimationFrameCalled = true;
      callback(0);
      return 1;
    };
    window.Element.prototype.scrollIntoView = function scrollIntoView() {
      scrollTargets.push(this.id);
    };

    try {
      render(<ProjectShowcase projects={mockContent.projects} selectedProjectSlug="web-tool" />);

      expect(requestAnimationFrameCalled).toBe(true);
      expect(scrollTargets).toEqual(["web-tool"]);
      expect(screen.queryByRole("region", { name: /viewer/i })).toBeNull();
    } finally {
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.Element.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  test("renders direct download actions only when downloads exist", () => {
    const { container } = render(<DownloadActions downloads={[]} />);

    expect(container.textContent).toBe("");

    render(
      <DownloadActions
        downloads={[
          {
            platform: "mac",
            label: "Mac",
            href: "https://example.com/mac",
          },
          {
            platform: "windows",
            label: "Windows",
            href: "https://example.com/windows",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Mac" }).getAttribute("href")).toBe(
      "https://example.com/mac",
    );
    expect(screen.getByRole("link", { name: "Windows" }).getAttribute("href")).toBe(
      "https://example.com/windows",
    );
  });

  test("opens external project links in a new tab", () => {
    render(
      <ProjectLinkActions
        links={[{ kind: "live", label: "Open", href: "https://example.com/project" }]}
      />,
    );

    const openLink = screen.getByRole("link", { name: "Open" });

    expect(openLink.getAttribute("href")).toBe("https://example.com/project");
    expect(openLink.getAttribute("target")).toBe("_blank");
  });

  test("renders external artifact actions when no project slug is provided", () => {
    render(<ArtifactActions artifacts={[projectWithDownloads.artifacts[0]!]} />);

    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("href")).toContain(
      "docs/example/index.html",
    );
    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("target")).toBe("_blank");
  });

  test("keeps external coming-soon artifacts disabled", () => {
    render(
      <ArtifactActions
        artifacts={[
          {
            label: "Coverage",
            href: "https://example.com/coverage",
            comingSoon: true,
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Coverage coming soon" })).toBeTruthy();
  });
});
