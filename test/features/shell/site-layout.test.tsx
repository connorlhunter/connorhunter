import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SiteLayout } from "@/features/shell/site-layout";
import { dynamicContentIndicatorStorageKey } from "@/features/shell/dynamic-content-indicator";
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

  test("retains the current page content source state across navigation", async () => {
    window.sessionStorage.removeItem(dynamicContentIndicatorStorageKey);

    render(
      <SiteLayout content={mockContent} contentSource="Published example content">
        <h1>Example page</h1>
      </SiteLayout>,
    );

    const showDetails = screen.getByRole("button", { name: "Show dynamic content details" });
    expect(showDetails.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(showDetails);

    const hideDetails = screen.getByRole("button", { name: "Hide dynamic content details" });

    expect(hideDetails.textContent).toContain("Dynamic content: Published example content");
    expect(hideDetails.textContent).toContain("One source, every page, built to scale.");
    expect(hideDetails.getAttribute("aria-expanded")).toBe("true");

    cleanup();

    render(
      <SiteLayout content={mockContent} contentSource="Published example content">
        <h1>Next page</h1>
      </SiteLayout>,
    );

    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "Hide dynamic content details" })
          .getAttribute("aria-expanded"),
      ).toBe("true");
    });

    fireEvent.click(screen.getByRole("button", { name: "Hide dynamic content details" }));

    expect(
      screen
        .getByRole("button", { name: "Show dynamic content details" })
        .getAttribute("aria-expanded"),
    ).toBe("false");

    cleanup();
    window.sessionStorage.removeItem(dynamicContentIndicatorStorageKey);
  });

  test("keeps the content source control usable without session storage", async () => {
    const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");

    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage unavailable.");
      },
    });

    try {
      render(
        <SiteLayout content={mockContent} contentSource="Published example content">
          <h1>Example page</h1>
        </SiteLayout>,
      );

      await waitFor(() => {
        expect(
          screen
            .getByRole("button", { name: "Show dynamic content details" })
            .getAttribute("aria-expanded"),
        ).toBe("false");
      });

      fireEvent.click(screen.getByRole("button", { name: "Show dynamic content details" }));

      expect(
        screen
          .getByRole("button", { name: "Hide dynamic content details" })
          .getAttribute("aria-expanded"),
      ).toBe("true");
    } finally {
      if (sessionStorageDescriptor) {
        Object.defineProperty(window, "sessionStorage", sessionStorageDescriptor);
      }
      cleanup();
    }
  });
});
