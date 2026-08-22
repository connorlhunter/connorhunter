import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ProjectStatusBadge } from "@/features/projects/project-status-badge";
import { projectWithDownloads } from "../../mock-content";

describe("ProjectStatusBadge", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders each supported status with its semantic theme hook", () => {
    const statuses = [
      ["Live", "project-status-badge--live"],
      ["Architecture", "project-status-badge--architecture"],
      ["Operational", "project-status-badge--operational"],
      ["Coming soon", "project-status-badge--coming-soon"],
    ] as const;

    statuses.forEach(([status, className]) => {
      const { unmount } = render(
        <ProjectStatusBadge project={{ ...projectWithDownloads, links: [], status }} />,
      );
      const badge = screen.getByTestId("project-status-badge");

      expect(badge.textContent).toBe(status);
      expect(badge.classList.contains(className)).toBe(true);
      unmount();
    });
  });

  test("uses a status dot for live projects and an icon for every other status", () => {
    const { rerender } = render(<ProjectStatusBadge project={projectWithDownloads} />);

    expect(
      screen.getByTestId("project-status-badge").querySelector(".project-status-badge-dot"),
    ).toBeTruthy();

    rerender(
      <ProjectStatusBadge
        project={{ ...projectWithDownloads, links: [], status: "Architecture" }}
      />,
    );

    expect(screen.getByTestId("project-status-badge").querySelector("svg")).toBeTruthy();
  });
});
