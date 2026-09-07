import { afterEach, expect, test } from "bun:test";
import { act, fireEvent, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { themeBootstrapScript } from "@/features/theme/theme-bootstrap-script";
import { ThemeMeta } from "@/features/theme/theme-meta";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import { themeCookieName, themeStorageKey } from "@/features/theme/theme";

let root: Root | undefined;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.head.replaceChildren();
  document.body.replaceChildren();
  delete document.documentElement.dataset.scheme;
  window.localStorage.removeItem(themeStorageKey);
  document.cookie = `${themeCookieName}=; Path=/; Max-Age=0`;
});

test.each(["atlas", "midnight"])(
  "reuses the first-paint metadata when hydrating the saved %s theme",
  async (saved) => {
    const app = (
      <ThemeProvider>
        <ThemeMeta />
        <ThemeSwitcher />
      </ThemeProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(app);
    // The server places hoisted metadata in the document head.
    document.head.append(...container.querySelectorAll("meta"));
    document.body.append(container);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const colorScheme = document.querySelector('meta[name="color-scheme"]');
    window.localStorage.setItem(themeStorageKey, saved);
    new Function("document", "localStorage", "matchMedia", themeBootstrapScript)(
      document,
      window.localStorage,
      window.matchMedia,
    );
    const errors: unknown[] = [];

    await act(async () => {
      root = hydrateRoot(container, app, { onRecoverableError: (error) => errors.push(error) });
    });

    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(document.querySelectorAll('meta[name="color-scheme"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="theme-color"]')).toBe(themeColor);
    expect(document.querySelector('meta[name="color-scheme"]')).toBe(colorScheme);
    expect(themeColor?.getAttribute("content")).toBe(saved === "midnight" ? "#171719" : "#fafaf9");

    fireEvent.click(screen.getByRole("button", { name: /Switch to .* theme/ }));
    expect(themeColor?.getAttribute("content")).toBe(saved === "midnight" ? "#fafaf9" : "#171719");
    expect(colorScheme?.getAttribute("content")).toBe(saved === "midnight" ? "light" : "dark");
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(errors).toEqual([]);
  },
);
