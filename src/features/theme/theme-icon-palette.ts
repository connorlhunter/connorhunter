export interface ThemeIconPalette {
  readonly contrast: string;
  readonly panel: string;
  readonly primary: string;
  readonly primaryStrong: string;
  readonly secondary: string;
}

/**
 * @param styles - Root computed styles.
 * @param token - CSS variable name.
 * @param fallback - Value used when the token is unavailable.
 * @returns A resolved theme color token.
 */
function themeToken(styles: CSSStyleDeclaration, token: string, fallback: string): string {
  return styles.getPropertyValue(token).trim() || fallback;
}

/**
 * @returns The active theme palette used for derived SVG icons.
 */
export function activeThemeIconPalette(): ThemeIconPalette {
  const styles = window.getComputedStyle(document.documentElement);
  const primary = themeToken(styles, "--accent", "#0f6b7a");

  return {
    contrast: themeToken(styles, "--accent-contrast", "#ffffff"),
    panel: themeToken(styles, "--panel", "#ffffff"),
    primary,
    primaryStrong: themeToken(styles, "--accent-strong", primary),
    secondary: themeToken(styles, "--warm", "#8a5a00"),
  };
}

/**
 * Replaces the shared project icon palette with active theme colors.
 *
 * @param svg - Source SVG text.
 * @param palette - Active theme icon palette.
 * @returns SVG text tinted to the active theme.
 */
export function tintThemeIconSvg(svg: string, palette: ThemeIconPalette): string {
  return svg
    .replace(/#0f6b7a/giu, palette.primary)
    .replace(/#0f7f8e/giu, palette.primary)
    .replace(/#138898/giu, palette.primary)
    .replace(/#0b5260/giu, palette.primaryStrong)
    .replace(/#35b8cd/giu, palette.secondary)
    .replace(/#5fc0ee/giu, palette.secondary)
    .replace(/#f4fbfc/giu, palette.contrast)
    .replace(/#eaf6ff/giu, palette.contrast)
    .replace(/#f8fbfc/giu, palette.panel)
    .replace(/#0b1a24/giu, palette.panel);
}
