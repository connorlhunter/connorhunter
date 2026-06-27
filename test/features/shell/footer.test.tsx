import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Footer } from "@/features/shell/footer";
import { publicAssetUrl } from "@/config/public-env";
import { mockContent } from "../../mock-content";

describe("Footer", () => {
  test("renders contact links and crypto identity badges from image assets", () => {
    render(<Footer brandName={mockContent.profile.name} contacts={mockContent.contacts} />);

    expect(screen.getByText(mockContent.profile.name)).toBeTruthy();
    expect(screen.getByRole("img", { name: "Bitcoin logo" }).getAttribute("src")).toBe(
      publicAssetUrl("assets/crypto/bitcoin-logo.webp"),
    );
    expect(screen.getByRole("img", { name: "Litecoin logo" }).getAttribute("src")).toBe(
      publicAssetUrl("assets/crypto/litecoin-logo.webp"),
    );
    expect(screen.getByText("Bitcoiner")).toBeTruthy();
    expect(screen.getAllByText("Since 2025")).toHaveLength(2);
    expect(screen.getByText("Litecoiner")).toBeTruthy();
    const contactLink = screen.getByRole("link", { name: mockContent.contacts[0]!.label });
    expect(contactLink.className).toContain("hover:-translate-y-0.5");
    expect(contactLink.className).toContain("hover:bg-(--accent-soft)");

    cleanup();
  });
});
