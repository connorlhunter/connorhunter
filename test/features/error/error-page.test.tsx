import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fallbackShellContent } from "@/content/fallback-shell";
import { ErrorPage } from "@/features/error/error-page";

describe("ErrorPage", () => {
  test("renders the shared shell and retries without navigation links", () => {
    let retryCount = 0;

    render(<ErrorPage content={fallbackShellContent} onRetry={() => retryCount++} />);

    expect(screen.getAllByText(fallbackShellContent.profile.name).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: fallbackShellContent.profile.name })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Toggle navigation menu" })).toBeNull();
    const heading = screen.getByRole("heading", { level: 1, name: "Something went wrong" });
    const panel = heading.closest(".not-found-panel");

    expect(panel).toBeTruthy();
    expect(within(panel as HTMLElement).queryByRole("link", { name: "Home" })).toBeNull();
    expect(within(panel as HTMLElement).queryByRole("link", { name: "Projects" })).toBeNull();

    fireEvent.click(within(panel as HTMLElement).getByRole("button", { name: "Retry" }));

    expect(retryCount).toBe(1);

    cleanup();
  });
});
