import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Footer } from "@/features/shell/footer";
import { mockContent } from "../../mock-content";

describe("Footer", () => {
  test("renders the site name and contact links", () => {
    render(<Footer brandName={mockContent.profile.name} contacts={mockContent.contacts} />);

    expect(screen.getByText(mockContent.profile.name)).toBeTruthy();
    const contactLink = screen.getByRole("link", { name: mockContent.contacts[0]!.label });
    expect(contactLink.className).toContain("hover:-translate-y-0.5");
    expect(contactLink.className).toContain("hover:bg-(--accent-soft)");

    cleanup();
  });
});
