import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Footer, formatLastUpdated } from "@/features/shell/footer";
import { mockContent } from "../../mock-content";

describe("Footer", () => {
  test("renders the site name and contact links", () => {
    render(
      <Footer
        brandName={mockContent.profile.name}
        contacts={mockContent.contacts}
        lastUpdated="2026-08-02"
      />,
    );

    expect(screen.getByText(mockContent.profile.name)).toBeTruthy();
    expect(screen.getByText(/Updated/u).textContent).toBe("Updated Aug 2, 2026");
    expect(screen.queryByText(/Last updated/u)).toBeNull();
    const contactLink = screen.getByRole("link", { name: mockContent.contacts[0]!.label });
    expect(contactLink.className).toContain("hover:-translate-y-0.5");
    expect(contactLink.className).toContain("hover:bg-(--accent-soft)");
    expect(screen.getByText("Aug 2, 2026").closest("time")?.getAttribute("datetime")).toBe(
      "2026-08-02",
    );

    cleanup();
  });

  test("formats update dates without a local timezone shift", () => {
    expect(formatLastUpdated("2026-08-02")).toBe("Aug 2, 2026");
  });

  test("places the dynamic content control beside the update stamp", () => {
    render(
      <Footer
        brandName={mockContent.profile.name}
        contacts={mockContent.contacts}
        contentSource="Profile and projects"
        lastUpdated="2026-08-02"
      />,
    );

    expect(screen.getByRole("button", { name: "Show dynamic content details" })).toBeTruthy();
    expect(screen.getByText("Aug 2, 2026")).toBeTruthy();
    cleanup();
  });
});
