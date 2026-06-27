import { useEffect, type ImgHTMLAttributes, type ReactNode } from "react";
import { applyThemedDocumentIcons } from "./theme-icon-document";
import { useOptionalTheme, useTheme } from "./theme-provider";
import { useThemedIconHref } from "./hooks/use-themed-icon-href";

export { tintThemeIconSvg, type ThemeIconPalette } from "./theme-icon-palette";

/**
 * @returns A non-visual bridge that syncs document icon links with the active theme.
 */
export function ThemeIconSync(): null {
  const { scheme } = useTheme();

  useEffect(() => {
    applyThemedDocumentIcons(scheme);
  }, [scheme]);

  return null;
}

/**
 * @param props - Standard image props with a theme-aware SVG source.
 * @returns An image that tints shared icon SVGs to the active scheme.
 */
export function ThemedIconImage({
  crossOrigin = "anonymous",
  src,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  readonly src: string;
}): ReactNode {
  const theme = useOptionalTheme();
  const themedSrc = useThemedIconHref(src, theme?.scheme ?? null);

  return <img {...props} crossOrigin={crossOrigin} data-icon-standard={src} src={themedSrc} />;
}
