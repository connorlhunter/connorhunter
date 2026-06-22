import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ThemeIconSync,
  tintThemeIconSvg,
  type ThemeIconPalette,
} from "@/features/theme/theme-icon";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import { themeCookieName, themeStorageKey } from "@/features/theme/theme";

const sourceSvg =
  '<svg><rect fill="#0f6b7a"/><path fill="#0b5260"/><circle fill="#35b8cd"/><path fill="#f4fbfc"/></svg>';

function clearSavedThemes(): void {
  window.localStorage.removeItem(themeStorageKey);
  document.cookie = `${themeCookieName}=; Path=/; Max-Age=0`;
}

function setThemeTokens({
  contrast,
  panel,
  primary,
  primaryStrong,
  secondary,
}: ThemeIconPalette): void {
  document.documentElement.style.setProperty("--accent", primary);
  document.documentElement.style.setProperty("--accent-strong", primaryStrong);
  document.documentElement.style.setProperty("--accent-contrast", contrast);
  document.documentElement.style.setProperty("--panel", panel);
  document.documentElement.style.setProperty("--warm", secondary);
}

function decodedIconHref(): string {
  const href = document
    .querySelector<HTMLLinkElement>("link[data-theme-icon]")
    ?.getAttribute("href");

  return href ? decodeURIComponent(href) : "";
}

describe("theme icons", () => {
  afterEach(() => {
    cleanup();
    clearSavedThemes();
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("style");
  });

  test("tints shared SVG icon colors with the active theme palette", () => {
    const tinted = tintThemeIconSvg(sourceSvg, {
      contrast: "#fafafa",
      panel: "#101010",
      primary: "#123456",
      primaryStrong: "#234567",
      secondary: "#765432",
    });

    expect(tinted).toContain("#123456");
    expect(tinted).toContain("#234567");
    expect(tinted).toContain("#765432");
    expect(tinted).toContain("#fafafa");
    expect(tinted).not.toContain("#0f6b7a");
    expect(tinted).not.toContain("#f4fbfc");
  });

  test("updates document icon links when the selected theme changes", async () => {
    const originalFetch = globalThis.fetch;
    const iconHref = "https://assets.example.com/icons/example/mark.svg";

    document.head.innerHTML = `<link rel="icon" type="image/svg+xml" href="${iconHref}" data-theme-icon data-icon-standard="${iconHref}">`;
    setThemeTokens({
      contrast: "#ffffff",
      panel: "#ffffff",
      primary: "#111111",
      primaryStrong: "#222222",
      secondary: "#333333",
    });
    clearSavedThemes();

    globalThis.fetch = ((_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
      Promise.resolve(new Response(sourceSvg, { status: 200 }))) as unknown as typeof fetch;

    try {
      render(
        <ThemeProvider>
          <ThemeIconSync />
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(decodedIconHref()).toContain("#111111");
      });

      setThemeTokens({
        contrast: "#eeeeee",
        panel: "#101010",
        primary: "#444444",
        primaryStrong: "#555555",
        secondary: "#666666",
      });
      fireEvent.click(screen.getByRole("button", { name: "Use Paper color scheme" }));

      await waitFor(() => {
        expect(decodedIconHref()).toContain("#444444");
      });
      expect(decodedIconHref()).toContain("data:image/svg+xml");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("uses the current href as the standard icon when the data attribute is absent", async () => {
    const originalFetch = globalThis.fetch;
    const iconHref = "https://assets.example.com/icons/example/no-data.svg";

    document.head.innerHTML = `<link rel="icon" type="image/svg+xml" href="${iconHref}" data-theme-icon>`;
    setThemeTokens({
      contrast: "#ffffff",
      panel: "#ffffff",
      primary: "#777777",
      primaryStrong: "#888888",
      secondary: "#999999",
    });
    clearSavedThemes();

    globalThis.fetch = ((_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
      Promise.resolve(new Response(sourceSvg, { status: 200 }))) as unknown as typeof fetch;

    try {
      render(
        <ThemeProvider>
          <ThemeIconSync />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(decodedIconHref()).toContain("#777777");
      });
      expect(
        document.querySelector<HTMLLinkElement>("link[data-theme-icon]")?.dataset.iconStandard,
      ).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
