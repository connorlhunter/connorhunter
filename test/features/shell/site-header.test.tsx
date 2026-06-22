import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SiteHeader } from "@/features/shell/site-header";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { mockContent } from "../../mock-content";

describe("SiteHeader", () => {
  test("opens and closes the mobile navigation menu", () => {
    render(
      <ThemeProvider>
        <SiteHeader navigation={mockContent.navigation} profile={mockContent.profile} />
      </ThemeProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle navigation menu" });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Resume" })).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(mobileNavigation).getByRole("link", { name: "Skills" })).toBeTruthy();
    expect(within(mobileNavigation).queryByRole("link", { name: "Resume" })).toBeNull();

    fireEvent.click(within(mobileNavigation).getByRole("link", { name: "Skills" }));

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();

    cleanup();
  });

  test("omits route links and mobile menu when navigation is empty", () => {
    render(
      <ThemeProvider>
        <SiteHeader navigation={[]} profile={mockContent.profile} />
      </ThemeProvider>,
    );

    expect(screen.getByText(mockContent.profile.name)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /example person/i })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Toggle navigation menu" })).toBeNull();
    expect(screen.getByRole("button", { name: /color scheme/i })).toBeTruthy();

    cleanup();
  });
});
