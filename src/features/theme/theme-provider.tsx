"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultThemeScheme,
  findThemeScheme,
  nextThemeScheme,
  themeMessageType,
  themeStorageKey,
  type ThemeScheme,
} from "./theme";
import { persistThemeScheme, preferredThemeScheme, savedThemeScheme } from "./theme-preference";

interface ThemeContextValue {
  readonly scheme: ThemeScheme;
  readonly nextScheme: ThemeScheme;
  readonly cycleScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * @param scheme - Theme scheme to apply.
 * @returns Nothing; updates the root dataset used by CSS variables.
 */
function applyScheme(scheme: ThemeScheme): void {
  document.documentElement.dataset.scheme = scheme.id;
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
 * @param scheme - Theme scheme to send to embedded artifact viewers.
 * @returns Nothing; inaccessible frames are ignored.
 */
function broadcastScheme(scheme: ThemeScheme): void {
  const message = { scheme: scheme.id, type: themeMessageType };

  for (const frame of document.querySelectorAll("iframe")) {
    try {
      frame.contentWindow?.postMessage(message, "*");
    } catch {
      // Cross-origin or unloading frames can reject messages; the saved theme still applies on reload.
    }
  }
}

/**
 * @param event - Browser storage event from another same-origin document.
 * @returns A valid theme scheme from localStorage changes, when present.
 */
function storageEventScheme(event: StorageEvent): ThemeScheme | null {
  return event.key === themeStorageKey ? findThemeScheme(event.newValue) : null;
}

/**
 * @param props - React children that need theme context.
 * @returns A theme context provider synced to the document dataset.
 */
export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const [scheme, setScheme] = useState<ThemeScheme>(defaultThemeScheme);

  useEffect(() => {
    const initialScheme = savedThemeScheme() ?? preferredThemeScheme();
    setScheme(initialScheme);
    applyScheme(initialScheme);
  }, []);

  useEffect(() => {
    function syncScheme(next: ThemeScheme, persist: boolean, broadcast: boolean): void {
      setScheme(next);
      applyScheme(next);
      if (persist) persistThemeScheme(next);
      if (broadcast) broadcastScheme(next);
    }

    function onMessage(event: MessageEvent): void {
      const next = messageScheme(event.data);
      if (next) syncScheme(next, true, true);
    }

    function onStorage(event: StorageEvent): void {
      const next = storageEventScheme(event);
      if (next) syncScheme(next, false, true);
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const nextScheme = nextThemeScheme(scheme);

    return {
      scheme,
      nextScheme,
      cycleScheme: () => {
        const next = nextThemeScheme(scheme);
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
 * @returns The current theme scheme, next scheme, and cycle action.
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
