import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomePage } from "@/features/home/home-page";
import { mockContent, projectWithDownloads, projectWithoutDownloads } from "../../mock-content";

const featuredCarouselContent = {
  ...mockContent,
  featuredWork: {
    additionalPages: [
      {
        id: "cipher-preview",
        items: [
          {
            id: "cipher-preview-card",
            projectSlug: "cipher",
            title: "Cipher preview",
            summary: "A private space for the conversations that matter most.",
            href: "/projects?project=cipher#cipher",
            imageHref: "https://example.com/cipher-placeholder.webp",
            badge: { icon: "clock" as const, label: "Coming soon", tone: "blue" as const },
          },
        ],
      },
    ],
    autoAdvanceMs: 5_000,
  },
  projects: [
    { ...projectWithDownloads, slug: "portfolio", title: "Portfolio" },
    {
      ...projectWithoutDownloads,
      slug: "cipher",
      status: "Coming soon",
      title: "Cipher",
    },
    { ...projectWithDownloads, slug: "ledger", title: "Ledger" },
    { ...projectWithoutDownloads, slug: "pay", title: "Pay" },
  ],
};

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders dynamic profile, navigation, and featured project links", () => {
    render(<HomePage content={mockContent} />);

    expect(screen.getByRole("heading", { level: 1, name: "Example Person" })).toBeTruthy();
    expect(screen.getByText("Example positioning.")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Main Pages" })).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: /Skills/ })
        .some((link) => link.getAttribute("href") === "/skills"),
    ).toBe(true);
    expect(screen.getByRole("link", { name: /Desktop Tool/ }).getAttribute("href")).toBe(
      "/projects?project=desktop-tool#desktop-tool",
    );
    expect(
      screen
        .getByRole("link", { name: /Desktop Tool/ })
        .querySelector("[data-testid='project-status-badge']")?.textContent,
    ).toBe("Live");
  });

  test("keeps project cards on the first page and renders configured image pages after it", () => {
    const { container } = render(<HomePage content={featuredCarouselContent} />);

    expect(screen.getByRole("button", { name: "Show next featured work" })).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Featured work pages" })).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(container.querySelectorAll(".home-project-card")).toHaveLength(3);
    expect(
      [...container.querySelectorAll(".home-featured-list--images")].every(
        (page) => page.children.length === 1,
      ),
    ).toBe(true);

    fireEvent.click(screen.getAllByRole("tab")[1]!);
    expect(
      container.querySelector(".home-featured-carousel-footer .home-featured-item-badge")
        ?.className,
    ).toContain("home-featured-item-badge--blue");
    expect(
      container.querySelector(".home-featured-image-details .home-featured-image-project-icon"),
    ).toBeTruthy();
    expect(
      screen.getByText("A private space for the conversations that matter most."),
    ).toBeTruthy();
    expect(container.querySelector(".home-featured-carousel-footer-badge")).toBeNull();
    expect(screen.getByRole("link", { name: "Cipher preview" }).getAttribute("href")).toBe(
      "/projects?project=cipher#cipher",
    );
    expect(screen.getByRole("link", { name: /Cipher/ })).toBeTruthy();
  });

  test("loops through featured pages from controls and touch swipes", () => {
    const { container } = render(<HomePage content={featuredCarouselContent} />);
    const carousel = container.querySelector<HTMLElement>(".home-featured-carousel");

    if (!carousel) throw new Error("Expected the Featured Work carousel.");

    fireEvent.click(screen.getByRole("button", { name: "Show previous featured work" }));
    expect(screen.getAllByRole("tab")[1]?.getAttribute("aria-selected")).toBe("true");

    fireEvent.pointerDown(carousel, { clientX: 220, pointerType: "touch" });
    fireEvent.pointerUp(carousel, { clientX: 120, pointerType: "touch" });
    expect(screen.getAllByRole("tab")[0]?.getAttribute("aria-selected")).toBe("true");
  });
});
