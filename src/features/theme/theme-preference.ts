import {
  defaultDarkThemeScheme,
  defaultLightThemeScheme,
  findThemeScheme,
  sharedThemeRootDomain,
  themeCookieMaxAgeSeconds,
  themeCookieName,
  themeStorageKey,
  type ThemeScheme,
} from "./theme";

/**
 * @param key - localStorage key to read.
 * @returns A valid theme scheme from localStorage, when available.
 */
function storageScheme(key: string): ThemeScheme | null {
  try {
    return findThemeScheme(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

/**
 * @param name - Cookie name to read.
 * @returns The decoded cookie value, when present.
 */
function cookieValue(name: string): string | null {
  try {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(prefix))
      ?.slice(prefix.length);

    return cookie ? decodeURIComponent(cookie) : null;
  } catch {
    return null;
  }
}

/**
 * @param hostname - Browser hostname.
 * @returns Cookie domain that can be shared by this product family.
 */
export function sharedThemeCookieDomain(hostname = window.location.hostname): string | null {
  const normalizedHostname = hostname.toLowerCase();

  if (
    normalizedHostname === sharedThemeRootDomain ||
    normalizedHostname.endsWith(`.${sharedThemeRootDomain}`)
  ) {
    return `.${sharedThemeRootDomain}`;
  }

  return null;
}

/**
 * @returns A saved theme from canonical storage or the shared cookie.
 */
export function savedThemeScheme(): ThemeScheme | null {
  const canonicalScheme = storageScheme(themeStorageKey);
  if (canonicalScheme) return canonicalScheme;

  const cookieScheme = findThemeScheme(cookieValue(themeCookieName));
  if (cookieScheme) return cookieScheme;

  return null;
}

/**
 * @returns The OS-aware initial theme when no saved scheme exists.
 */
export function preferredThemeScheme(): ThemeScheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? defaultDarkThemeScheme
    : defaultLightThemeScheme;
}

/**
 * @param scheme - Theme scheme to persist across this origin and sibling subdomains.
 * @returns Nothing; storage failures are ignored for local previews and privacy modes.
 */
export function persistThemeScheme(scheme: ThemeScheme): void {
  try {
    window.localStorage.setItem(themeStorageKey, scheme.id);
  } catch {
    // Local previews and privacy modes may block storage.
  }

  try {
    const attributes = [
      `${themeCookieName}=${encodeURIComponent(scheme.id)}`,
      "Path=/",
      `Max-Age=${themeCookieMaxAgeSeconds}`,
      "SameSite=Lax",
    ];
    const domain = sharedThemeCookieDomain();

    if (domain) attributes.push(`Domain=${domain}`);
    if (window.location.protocol === "https:") attributes.push("Secure");

    document.cookie = attributes.join("; ");
  } catch {
    // Cookie writes may fail for file previews or locked-down browsers.
  }
}
