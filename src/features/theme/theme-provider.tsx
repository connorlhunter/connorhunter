import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { publicConfig } from "@/config/public-env";
import {
  defaultThemeScheme,
  findThemeScheme,
  oppositeThemeScheme,
  themeColorMetaName,
  themeMessageType,
  themeStorageKey,
  type ThemeScheme,
} from "./theme";
import { persistThemeScheme, preferredThemeScheme, savedThemeScheme } from "./theme-preference";

interface ThemeContextValue {
  readonly scheme: ThemeScheme;
  readonly nextScheme: ThemeScheme;
  readonly toggleScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * @returns The current document origin, with a configured fallback for non-browser test DOMs.
 */
function currentThemeOrigin(): string {
  return new URL(window.location.origin, publicConfig.siteOrigin).origin;
}

/**
 * @param frame - Embedded document that may participate in theme synchronization.
 * @returns The trusted target origin for the frame, or null when it is not a portfolio viewer.
 */
function trustedThemeFrameOrigin(frame: HTMLIFrameElement): string | null {
  try {
    const currentOrigin = currentThemeOrigin();
    const origin = new URL(frame.getAttribute("src") ?? frame.src, `${currentOrigin}/`).origin;
    const artifactOrigin = new URL(publicConfig.artifactsOrigin).origin;

    return origin === currentOrigin || origin === artifactOrigin ? origin : null;
  } catch {
    return null;
  }
}

/**
 * @param event - Cross-frame browser message.
 * @returns Whether the message came from a trusted embedded portfolio viewer.
 */
function isTrustedThemeMessage(event: MessageEvent): boolean {
  if (!event.source) return false;

  return Array.from(document.querySelectorAll("iframe")).some((frame) => {
    const origin = trustedThemeFrameOrigin(frame);

    return origin === event.origin && frame.contentWindow === event.source;
  });
}

/**
 * @param scheme - Theme scheme to apply.
 * @returns Nothing; updates CSS variables, browser controls, and browser chrome.
 */
function applyScheme(scheme: ThemeScheme): void {
  document.documentElement.dataset.scheme = scheme.id;
  document.documentElement.style.colorScheme = scheme.colorScheme;
  document
    .querySelector<HTMLMetaElement>(`meta[name="${themeColorMetaName}"]`)
    ?.setAttribute("content", scheme.themeColor);
}

/**
 * @param value - Potential cross-frame message payload.
 * @returns A valid theme scheme from a viewer message, when present.
 */
function messageScheme(value: unknown): ThemeScheme | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = value as { readonly scheme?: unknown; readonly type?: unknown };

  return message.type === themeMessageType && typeof message.scheme === "string"
    ? findThemeScheme(message.scheme)
    : null;
}

/**
 * @param frame - Embedded artifact viewer frame.
 * @param scheme - Theme scheme to send.
 * @returns Nothing; inaccessible or unloading frames are ignored.
 */
export function postThemeSchemeToFrame(frame: HTMLIFrameElement, scheme: ThemeScheme): void {
  const message = { scheme: scheme.id, type: themeMessageType };
  const targetOrigin = trustedThemeFrameOrigin(frame);

  if (!targetOrigin) return;

  try {
    frame.contentWindow?.postMessage(message, targetOrigin);
  } catch {
    // Cross-origin or unloading frames can reject messages; the saved theme still applies on reload.
  }
}

/**
 * @param scheme - Theme scheme to send to embedded artifact viewers.
 * @returns Nothing; inaccessible frames are ignored.
 */
function broadcastScheme(scheme: ThemeScheme): void {
  for (const frame of document.querySelectorAll("iframe")) {
    postThemeSchemeToFrame(frame, scheme);
  }
}

/**
 * @param props - React children that need theme context.
 * @returns A provider that follows the OS until a preference is explicitly selected.
 */
export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const [scheme, setScheme] = useState<ThemeScheme>(defaultThemeScheme);
  const activeScheme = useRef(defaultThemeScheme);
  const hasExplicitPreference = useRef(false);

  useEffect(() => {
    const saved = savedThemeScheme();
    const initialScheme = saved ?? preferredThemeScheme();
    activeScheme.current = initialScheme;
    hasExplicitPreference.current = saved !== null;
    setScheme(initialScheme);
    applyScheme(initialScheme);
    if (saved) persistThemeScheme(saved);
    broadcastScheme(initialScheme);

    function syncScheme(next: ThemeScheme): void {
      if (activeScheme.current.id === next.id) return;

      activeScheme.current = next;
      setScheme(next);
      applyScheme(next);
      broadcastScheme(next);
    }

    function onMessage(event: MessageEvent): void {
      if (!isTrustedThemeMessage(event)) return;

      const next = messageScheme(event.data);
      // Viewers may echo broadcasts; an unchanged reply is not a new preference.
      if (!next || next.id === activeScheme.current.id) return;
      hasExplicitPreference.current = true;
      persistThemeScheme(next);
      syncScheme(next);
    }

    function onStorage(event: StorageEvent): void {
      if (event.key !== themeStorageKey) return;
      const next = findThemeScheme(event.newValue);
      if (!next) return;
      hasExplicitPreference.current = true;
      persistThemeScheme(next);
      syncScheme(next);
    }

    function onSystemChange(): void {
      if (!hasExplicitPreference.current) syncScheme(preferredThemeScheme());
    }

    let media: MediaQueryList | undefined;
    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", onSystemChange);
    } catch {
      // Keep the initial fallback when media queries are unavailable.
    }
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);

    return () => {
      media?.removeEventListener("change", onSystemChange);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const nextScheme = oppositeThemeScheme(scheme);

    return {
      scheme,
      nextScheme,
      toggleScheme: () => {
        const next = oppositeThemeScheme(activeScheme.current);
        activeScheme.current = next;
        hasExplicitPreference.current = true;
        setScheme(next);
        applyScheme(next);
        persistThemeScheme(next);
        broadcastScheme(next);
      },
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * @returns The current theme scheme, opposite scheme, and toggle action.
 */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return value;
}

/**
 * @returns The current theme context, or null when a component is rendered outside the site shell.
 */
export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
