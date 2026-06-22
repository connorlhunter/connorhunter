import {
  defaultDarkThemeScheme,
  defaultLightThemeScheme,
  themeCookieName,
  themeSchemes,
  themeStorageKey,
} from "./theme";

/**
 * @description Inline first-paint theme bootstrap.
 *
 * This runs before React hydrates so the root `data-scheme` matches the saved
 * or OS-preferred theme before the browser paints the page. Keeping it inline
 * avoids a light/dark flash during hydration. The script is built only from
 * repo-owned constants, not user or remote content.
 */
export const themeBootstrapScript = `
(() => {
  const supportedThemes = ${JSON.stringify(themeSchemes.map((scheme) => scheme.id))};
  const storageKey = ${JSON.stringify(themeStorageKey)};
  const cookieName = ${JSON.stringify(themeCookieName)};
  const lightScheme = ${JSON.stringify(defaultLightThemeScheme.id)};
  const darkScheme = ${JSON.stringify(defaultDarkThemeScheme.id)};

  function validTheme(value) {
    return supportedThemes.includes(value) ? value : null;
  }

  function storedTheme(key) {
    try {
      return validTheme(localStorage.getItem(key));
    } catch (error) {
      return null;
    }
  }

  function cookieTheme() {
    try {
      const prefix = cookieName + "=";
      const rows = document.cookie ? document.cookie.split("; ") : [];

      for (const row of rows) {
        if (row.startsWith(prefix)) {
          return validTheme(decodeURIComponent(row.slice(prefix.length)));
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function preferredTheme() {
    try {
      return matchMedia("(prefers-color-scheme: dark)").matches ? darkScheme : lightScheme;
    } catch (error) {
      return lightScheme;
    }
  }

  document.documentElement.dataset.scheme =
    storedTheme(storageKey) || cookieTheme() || preferredTheme();
})();
`;
