import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/features/theme/theme-provider";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import { themeBootstrapScript } from "@/features/theme/theme-bootstrap-script";
import {
  defaultDarkThemeScheme,
  defaultLightThemeScheme,
  sharedThemeRootDomain,
  themeCookieName,
  themeColorMetaName,
  themeMessageType,
  themeSchemes,
  themeStorageKey,
} from "@/features/theme/theme";
import {
  persistThemeScheme,
  savedThemeScheme,
  sharedThemeCookieDomain,
} from "@/features/theme/theme-preference";

const artifactGeneratorThemeIds = [
  "atlas",
  "paper",
  "citrine",
  "harbor",
  "midnight",
  "onyx",
  "rose",
  "tide",
  "ember",
  "quartz",
] as const;

function ThemeConsumerWithoutProvider(): null {
  useTheme();

  return null;
}

function setPreferredDark(matches: boolean): void {
  window.matchMedia = (query: string): MediaQueryList => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  });
}

function clearSavedThemes(): void {
  window.localStorage.removeItem(themeStorageKey);
  document.cookie = `${themeCookieName}=; Path=/; Max-Age=0`;
}

function mockDocumentCookie(initialCookie = ""): {
  readonly cookie: () => string;
  readonly restore: () => void;
} {
  const cookieDescriptor = Object.getOwnPropertyDescriptor(document, "cookie");
  let cookie = initialCookie;

  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => cookie,
    set: (value: string) => {
      cookie = value;
    },
  });

  return {
    cookie: () => cookie,
    restore: () => {
      if (cookieDescriptor) {
        Object.defineProperty(document, "cookie", cookieDescriptor);
      } else {
        Reflect.deleteProperty(document, "cookie");
      }
    },
  };
}

describe("ThemeSwitcher", () => {
  test("exposes every Artifact Generator theme in the same cycle order", () => {
    expect(themeSchemes.map((scheme) => scheme.id)).toEqual([...artifactGeneratorThemeIds]);

    const styles = readFileSync(join(process.cwd(), "src", "styles.css"), "utf8");

    for (const scheme of artifactGeneratorThemeIds) {
      expect(styles).toContain(`:root[data-scheme="${scheme}"]`);

      const theme = themeSchemes.find((candidate) => candidate.id === scheme);
      expect(theme).toBeDefined();
      expect(styles).toContain(`--bg: ${theme?.themeColor};`);
    }
  });

  test("synchronizes browser chrome with the initial and selected themes", async () => {
    clearSavedThemes();
    window.localStorage.setItem(themeStorageKey, "midnight");
    const themeColorMeta = document.createElement("meta");
    themeColorMeta.name = themeColorMetaName;
    themeColorMeta.content = defaultLightThemeScheme.themeColor;
    document.head.append(themeColorMeta);

    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("midnight");
      });
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(themeColorMeta.content).toBe(defaultDarkThemeScheme.themeColor);

      fireEvent.click(screen.getByRole("button", { name: "Use Onyx color scheme" }));

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("onyx");
      });
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(themeColorMeta.content).toBe("#0b0d10");
    } finally {
      themeColorMeta.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("sets Safari chrome metadata before hydration", () => {
    clearSavedThemes();
    window.localStorage.setItem(themeStorageKey, "midnight");
    const themeColorMeta = document.createElement("meta");
    themeColorMeta.name = themeColorMetaName;
    themeColorMeta.content = defaultLightThemeScheme.themeColor;
    document.head.append(themeColorMeta);

    try {
      const runBootstrap = new Function(
        "document",
        "localStorage",
        "matchMedia",
        themeBootstrapScript,
      );
      runBootstrap(document, window.localStorage, window.matchMedia);

      expect(document.documentElement.dataset.scheme).toBe("midnight");
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(themeColorMeta.content).toBe(defaultDarkThemeScheme.themeColor);
    } finally {
      themeColorMeta.remove();
      clearSavedThemes();
    }
  });

  test("cycles document schemes and persists the selected theme", async () => {
    const mockedCookie = mockDocumentCookie();
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";

    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("atlas");
      });

      const switcher = screen.getByRole("button", { name: "Use Paper color scheme" });

      for (const nextScheme of artifactGeneratorThemeIds.slice(1)) {
        fireEvent.click(switcher);

        await waitFor(() => {
          expect(document.documentElement.dataset.scheme).toBe(nextScheme);
        });
        expect(window.localStorage.getItem(themeStorageKey)).toBe(nextScheme);
        expect(mockedCookie.cookie()).toContain(`${themeCookieName}=${nextScheme}`);
      }

      fireEvent.click(switcher);

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("atlas");
      });
      expect(window.localStorage.getItem(themeStorageKey)).toBe("atlas");
    } finally {
      mockedCookie.restore();
    }

    cleanup();
  });

  test("broadcasts theme changes to embedded artifact viewers", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";
    const postedMessages: Array<ReadonlyArray<unknown>> = [];
    const iframe = document.createElement("iframe");

    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: {
        postMessage: (...args: Array<unknown>) => {
          postedMessages.push(args);
        },
      },
    });
    document.body.append(iframe);

    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("atlas");
      });

      fireEvent.click(screen.getByRole("button", { name: "Use Paper color scheme" }));

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("paper");
      });
      expect(postedMessages).toContainEqual([{ scheme: "paper", type: themeMessageType }, "*"]);
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("broadcasts the initial saved theme to embedded artifact viewers", async () => {
    clearSavedThemes();
    window.localStorage.setItem(themeStorageKey, "rose");
    document.documentElement.dataset.scheme = "atlas";
    const postedMessages: Array<ReadonlyArray<unknown>> = [];
    const iframe = document.createElement("iframe");

    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: {
        postMessage: (...args: Array<unknown>) => {
          postedMessages.push(args);
        },
      },
    });
    document.body.append(iframe);

    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("rose");
      });
      expect(postedMessages).toContainEqual([{ scheme: "rose", type: themeMessageType }, "*"]);
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("applies theme messages from embedded artifact viewers", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";

    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("atlas");
    });

    const messageEvent = new window.Event("message") as MessageEvent;

    Object.defineProperty(messageEvent, "data", {
      value: { scheme: "rose", type: themeMessageType },
    });
    Object.defineProperty(messageEvent, "origin", {
      value: "https://assets.example.com",
    });
    act(() => {
      window.dispatchEvent(messageEvent);
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("rose");
    });
    expect(window.localStorage.getItem(themeStorageKey)).toBe("rose");

    cleanup();
    clearSavedThemes();
  });

  test("ignores invalid theme messages", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";

    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("atlas");
    });

    const messageEvent = new window.Event("message") as MessageEvent;

    Object.defineProperty(messageEvent, "data", {
      value: null,
    });
    act(() => {
      window.dispatchEvent(messageEvent);
    });

    expect(document.documentElement.dataset.scheme).toBe("atlas");

    const wrongTypeMessageEvent = new window.Event("message") as MessageEvent;

    Object.defineProperty(wrongTypeMessageEvent, "data", {
      value: { scheme: "rose", type: "other.theme.message" },
    });
    act(() => {
      window.dispatchEvent(wrongTypeMessageEvent);
    });

    expect(document.documentElement.dataset.scheme).toBe("atlas");

    cleanup();
    clearSavedThemes();
  });

  test("applies same-origin theme storage changes from artifact viewers", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";

    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("atlas");
    });

    const storageEvent = new window.Event("storage") as StorageEvent;

    Object.defineProperty(storageEvent, "key", {
      value: themeStorageKey,
    });
    Object.defineProperty(storageEvent, "newValue", {
      value: "ember",
    });
    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("ember");
    });

    cleanup();
    clearSavedThemes();
  });

  test("falls back to the light default when saved theme storage is unavailable", async () => {
    const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage unavailable.");
      },
    });
    document.documentElement.dataset.scheme = "harbor";

    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe(defaultLightThemeScheme.id);
      });
    } finally {
      if (localStorageDescriptor) {
        Object.defineProperty(window, "localStorage", localStorageDescriptor);
      }
      cleanup();
    }
  });

  test("uses the OS dark default when no saved scheme exists", async () => {
    clearSavedThemes();
    setPreferredDark(true);
    document.documentElement.dataset.scheme = defaultLightThemeScheme.id;

    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe(defaultDarkThemeScheme.id);
    });

    cleanup();
    setPreferredDark(false);
  });

  test("uses a saved scheme before OS preference", async () => {
    clearSavedThemes();
    window.localStorage.setItem(themeStorageKey, "rose");
    setPreferredDark(true);
    document.documentElement.dataset.scheme = defaultLightThemeScheme.id;

    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("rose");
    });

    cleanup();
    clearSavedThemes();
    setPreferredDark(false);
  });

  test("uses a shared cookie when no saved theme exists", async () => {
    clearSavedThemes();
    const mockedCookie = mockDocumentCookie(`${themeCookieName}=tide`);
    setPreferredDark(true);
    document.documentElement.dataset.scheme = defaultLightThemeScheme.id;

    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("tide");
      });
    } finally {
      mockedCookie.restore();
    }

    cleanup();
    clearSavedThemes();
    setPreferredDark(false);
  });

  test("scopes the shared cookie to production root and subdomain hosts", () => {
    expect(sharedThemeCookieDomain(sharedThemeRootDomain)).toBe(`.${sharedThemeRootDomain}`);
    expect(sharedThemeCookieDomain(`cipher.${sharedThemeRootDomain}`)).toBe(
      `.${sharedThemeRootDomain}`,
    );
    expect(sharedThemeCookieDomain("localhost")).toBeNull();
  });

  test("ignores storage and cookie failures while persisting", () => {
    const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    const cookieDescriptor = Object.getOwnPropertyDescriptor(document, "cookie");

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage unavailable.");
      },
    });
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => {
        throw new Error("Cookies unavailable.");
      },
      set: () => {
        throw new Error("Cookies unavailable.");
      },
    });

    try {
      expect(savedThemeScheme()).toBeNull();
      expect(() => persistThemeScheme(defaultLightThemeScheme)).not.toThrow();
    } finally {
      if (localStorageDescriptor) {
        Object.defineProperty(window, "localStorage", localStorageDescriptor);
      }
      if (cookieDescriptor) {
        Object.defineProperty(document, "cookie", cookieDescriptor);
      } else {
        Reflect.deleteProperty(document, "cookie");
      }
      clearSavedThemes();
    }
  });

  test("throws when theme context is used outside the provider", () => {
    expect(() => render(<ThemeConsumerWithoutProvider />)).toThrow(
      "useTheme must be used inside ThemeProvider.",
    );

    cleanup();
  });
});
