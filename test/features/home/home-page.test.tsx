import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { HomePage } from "@/features/home/home-page";
import { mockContent } from "../../mock-content";

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
  });
});
