import {
  activeThemeIconPalette,
  tintThemeIconSvg,
  type ThemeIconPalette,
} from "./theme-icon-palette";

const iconSvgCache = new Map<string, Promise<string | null>>();
const themedIconCache = new Map<string, string>();

/**
 * @param href - SVG href to load.
 * @returns Source SVG text, or null when loading fails.
 */
async function loadIconSvg(href: string): Promise<string | null> {
  let cached = iconSvgCache.get(href);

  if (!cached) {
    cached = fetch(href)
      .then((response): Promise<string | null> => {
        return response.ok ? response.text() : Promise.resolve(null);
      })
      .catch((): null => null);
    iconSvgCache.set(href, cached);
  }

  return cached;
}

/**
 * @param href - Standard SVG icon href.
 * @param palette - Theme icon palette.
 * @returns The theme-tinted icon href, or the original href when tinting is unavailable.
 */
export async function themedIconHref(
  href: string,
  palette: ThemeIconPalette = activeThemeIconPalette(),
): Promise<string> {
  if (href.startsWith("data:")) return href;

  const cacheKey = [
    href,
    palette.primary,
    palette.primaryStrong,
    palette.secondary,
    palette.contrast,
    palette.panel,
  ].join("|");
  const cached = themedIconCache.get(cacheKey);
  if (cached) return cached;

  const svg = await loadIconSvg(href);
  if (!svg) return href;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    tintThemeIconSvg(svg, palette),
  )}`;
  themedIconCache.set(cacheKey, dataUrl);

  return dataUrl;
}
