import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { SiteLayout } from "@/features/shell/site-layout";
import { mockContent } from "../../mock-content";

describe("SiteLayout", () => {
  test("provides a keyboard skip link to the main page content", () => {
    render(
      <SiteLayout content={mockContent}>
        <h1>Example page</h1>
      </SiteLayout>,
    );

    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    const main = screen.getByRole("main");

    expect(skipLink.getAttribute("href")).toBe("#main-content");
    expect(main.getAttribute("id")).toBe("main-content");
    expect(main.getAttribute("tabindex")).toBe("-1");

    cleanup();
  });
});
