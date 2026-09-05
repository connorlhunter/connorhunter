import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { publicConfig } from "@/config/public-env";
import { ThemeProvider, useTheme } from "@/features/theme/theme-provider";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import { themeBootstrapScript } from "@/features/theme/theme-bootstrap-script";
import {
  defaultDarkThemeScheme,
  defaultLightThemeScheme,
  findThemeScheme,
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

const themeIds = ["atlas", "midnight"] as const;
const migratedThemes = [
  ["atlas", "atlas"],
  ["paper", "atlas"],
  ["citrine", "atlas"],
  ["harbor", "midnight"],
  ["midnight", "midnight"],
  ["onyx", "midnight"],
  ["rose", "atlas"],
  ["tide", "atlas"],
  ["ember", "atlas"],
  ["quartz", "atlas"],
] as const;
const artifactViewerOrigin = new URL(publicConfig.artifactsOrigin).origin;

function artifactViewerFrame(): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  frame.src = `${artifactViewerOrigin}/viewer.html`;

  return frame;
}

function dispatchThemeMessage(
  data: unknown,
  origin: string,
  source: MessageEventSource | null,
): void {
  const event = new window.Event("message") as MessageEvent;
  Object.defineProperties(event, {
    data: { value: data },
    origin: { value: origin },
    source: { value: source },
  });
  act(() => {
    window.dispatchEvent(event);
  });
}

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
  afterEach(() => {
    cleanup();
    clearSavedThemes();
    setPreferredDark(false);
  });

  test.each(migratedThemes)(
    "normalizes %s to %s before and after hydration",
    async (legacy, expected) => {
      for (const source of ["storage", "cookie"] as const) {
        clearSavedThemes();
        setPreferredDark(expected === "atlas");
        const cookie = mockDocumentCookie(
          source === "cookie" ? `${themeCookieName}=${legacy}` : "",
        );
        if (source === "storage") window.localStorage.setItem(themeStorageKey, legacy);
        try {
          new Function("document", "localStorage", "matchMedia", themeBootstrapScript)(
            document,
            window.localStorage,
            window.matchMedia,
          );
          expect(document.documentElement.dataset.scheme).toBe(expected);
          render(
            <ThemeProvider>
              <ThemeSwitcher />
            </ThemeProvider>,
          );
          await waitFor(() => expect(window.localStorage.getItem(themeStorageKey)).toBe(expected));
          expect(document.documentElement.dataset.scheme).toBe(expected);
          expect(cookie.cookie()).toContain(`${themeCookieName}=${expected}`);
        } finally {
          cleanup();
          cookie.restore();
        }
      }
    },
  );

  test.each(["unknown", "__proto__", "constructor", "", "toString"])(
    "ignores invalid preference %s in bootstrap and provider",
    async (invalid) => {
      clearSavedThemes();
      window.localStorage.setItem(themeStorageKey, invalid);
      setPreferredDark(true);
      expect(findThemeScheme(invalid)).toBeNull();
      new Function("document", "localStorage", "matchMedia", themeBootstrapScript)(
        document,
        window.localStorage,
        window.matchMedia,
      );
      expect(document.documentElement.dataset.scheme).toBe("midnight");
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );
      await waitFor(() => expect(document.documentElement.dataset.scheme).toBe("midnight"));
    },
  );

  test("prefers saved storage over a conflicting cookie and OS preference", () => {
    clearSavedThemes();
    window.localStorage.setItem(themeStorageKey, "citrine");
    setPreferredDark(true);
    const cookie = mockDocumentCookie(`${themeCookieName}=midnight`);
    try {
      new Function("document", "localStorage", "matchMedia", themeBootstrapScript)(
        document,
        window.localStorage,
        window.matchMedia,
      );
      expect(document.documentElement.dataset.scheme).toBe("atlas");
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );
      expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeTruthy();
      expect(window.localStorage.getItem(themeStorageKey)).toBe("atlas");
    } finally {
      cookie.restore();
    }
  });

  test("follows OS changes until an explicit choice and cleans up its listener", () => {
    clearSavedThemes();
    let dark = false;
    const media = new window.EventTarget() as unknown as MediaQueryList;
    Object.defineProperty(media, "matches", { get: () => dark });
    window.matchMedia = () => media;
    const removeListener = spyOn(media, "removeEventListener");
    function changeOS(matches: boolean): void {
      dark = matches;
      act(() => {
        media.dispatchEvent(new window.Event("change"));
      });
    }
    const { unmount } = render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeTruthy();
    changeOS(true);
    expect(document.documentElement.dataset.scheme).toBe("midnight");
    expect(window.localStorage.getItem(themeStorageKey)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    changeOS(false);
    changeOS(true);
    expect(document.documentElement.dataset.scheme).toBe("atlas");
    expect(window.localStorage.getItem(themeStorageKey)).toBe("atlas");
    unmount();
    expect(removeListener).toHaveBeenCalledWith("change", expect.any(Function));
    removeListener.mockRestore();
  });

  test("handles blocked storage and unavailable media queries before and after hydration", () => {
    clearSavedThemes();
    const cookie = mockDocumentCookie();
    const storage = Object.getOwnPropertyDescriptor(window, "localStorage");
    const unavailable = (): never => {
      throw new Error("Unavailable");
    };
    window.matchMedia = unavailable;
    Object.defineProperty(window, "localStorage", { configurable: true, get: unavailable });
    try {
      new Function("document", "localStorage", "matchMedia", themeBootstrapScript)(
        document,
        { getItem: unavailable },
        unavailable,
      );
      expect(document.documentElement.dataset.scheme).toBe("atlas");
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
      expect(document.documentElement.dataset.scheme).toBe("midnight");
    } finally {
      cleanup();
      if (storage) Object.defineProperty(window, "localStorage", storage);
      cookie.restore();
    }
  });

  test("does not rebroadcast echoes or equivalent legacy viewer messages", () => {
    clearSavedThemes();
    const posted: unknown[] = [];
    const frame = artifactViewerFrame();
    Object.defineProperty(frame, "contentWindow", {
      configurable: true,
      value: { postMessage: (message: unknown) => posted.push(message) },
    });
    document.body.append(frame);
    try {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      );
      expect(posted).toHaveLength(1);
      dispatchThemeMessage(
        { scheme: "atlas", type: themeMessageType },
        artifactViewerOrigin,
        frame.contentWindow,
      );
      expect(window.localStorage.getItem(themeStorageKey)).toBeNull();
      dispatchThemeMessage(
        { scheme: "onyx", type: themeMessageType },
        artifactViewerOrigin,
        frame.contentWindow,
      );
      expect(document.documentElement.dataset.scheme).toBe("midnight");
      expect(posted).toHaveLength(2);
      for (const scheme of ["midnight", "harbor", "onyx"]) {
        dispatchThemeMessage(
          { scheme, type: themeMessageType },
          artifactViewerOrigin,
          frame.contentWindow,
        );
      }
      expect(posted).toHaveLength(2);
    } finally {
      frame.remove();
    }
  });
  test("exposes only light and dark themes with matching browser chrome colors", () => {
    expect(themeSchemes.map((scheme) => scheme.id)).toEqual([...themeIds]);

    const styles = readFileSync(join(process.cwd(), "src", "styles.css"), "utf8");

    for (const scheme of themeIds) {
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

      fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("atlas");
      });
      expect(document.documentElement.style.colorScheme).toBe("light");
      expect(themeColorMeta.content).toBe(defaultLightThemeScheme.themeColor);
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

  test("toggles light and dark and persists the selected theme", async () => {
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

      const switcher = screen.getByRole("button", { name: "Switch to dark theme" });

      for (const nextScheme of themeIds.slice(1)) {
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
    const iframe = artifactViewerFrame();

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

      fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("midnight");
      });
      expect(postedMessages).toContainEqual([
        { scheme: "midnight", type: themeMessageType },
        artifactViewerOrigin,
      ]);
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
    const iframe = artifactViewerFrame();

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
      expect(postedMessages).toContainEqual([
        { scheme: "atlas", type: themeMessageType },
        artifactViewerOrigin,
      ]);
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("does not broadcast theme data to malformed viewer URLs", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";
    const postedMessages: Array<ReadonlyArray<unknown>> = [];
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", "https://[");
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
      expect(postedMessages).toEqual([]);
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("applies theme messages from trusted embedded artifact viewers", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";
    const iframe = artifactViewerFrame();
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

      dispatchThemeMessage(
        { scheme: "harbor", type: themeMessageType },
        artifactViewerOrigin,
        iframe.contentWindow,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("midnight");
      });
      expect(window.localStorage.getItem(themeStorageKey)).toBe("midnight");
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("ignores theme messages with an untrusted origin or source", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";
    const iframe = artifactViewerFrame();
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

      dispatchThemeMessage(
        { scheme: "rose", type: themeMessageType },
        "https://untrusted.example",
        iframe.contentWindow,
      );
      dispatchThemeMessage(
        { scheme: "rose", type: themeMessageType },
        artifactViewerOrigin,
        window,
      );

      expect(document.documentElement.dataset.scheme).toBe("atlas");
      expect(window.localStorage.getItem(themeStorageKey)).toBeNull();
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
  });

  test("ignores invalid theme messages", async () => {
    clearSavedThemes();
    document.documentElement.dataset.scheme = "atlas";
    const iframe = artifactViewerFrame();
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

      dispatchThemeMessage(null, artifactViewerOrigin, iframe.contentWindow);

      expect(document.documentElement.dataset.scheme).toBe("atlas");

      dispatchThemeMessage(
        { scheme: "rose", type: "other.theme.message" },
        artifactViewerOrigin,
        iframe.contentWindow,
      );

      expect(document.documentElement.dataset.scheme).toBe("atlas");
    } finally {
      iframe.remove();
      cleanup();
      clearSavedThemes();
    }
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
      value: "onyx",
    });
    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.scheme).toBe("midnight");
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
      expect(document.documentElement.dataset.scheme).toBe("atlas");
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
        expect(document.documentElement.dataset.scheme).toBe("atlas");
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
