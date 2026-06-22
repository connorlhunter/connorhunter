import type { ThemeScheme } from "./theme";
import { themedIconHref } from "./theme-icon-loader";

/**
 * @param element - Link with a standard icon href.
 * @returns The original icon href stored on the element.
 */
function standardIconHref(element: HTMLLinkElement): string | null {
  const storedHref = element.dataset.iconStandard;
  if (storedHref) return storedHref;

  const href = element.href;
  if (!href) return null;

  element.dataset.iconStandard = href;

  return href;
}

/**
 * Applies a theme-tinted href to one icon element.
 *
 * @param element - Link or image element to update.
 * @param scheme - Theme scheme currently being applied.
 */
async function applyThemedIconElement(
  element: HTMLLinkElement,
  scheme: ThemeScheme,
): Promise<void> {
  const href = standardIconHref(element);
  if (!href) return;

  element.href = href;

  const nextHref = await themedIconHref(href);
  const activeScheme = document.documentElement.dataset.scheme;
  const activeHref = standardIconHref(element);

  if (activeScheme !== scheme.id || activeHref !== href) return;

  element.href = nextHref;
}

/**
 * Applies theme-tinted icons to document head links.
 *
 * @param scheme - Theme scheme currently applied to the document.
 */
export function applyThemedDocumentIcons(scheme: ThemeScheme): void {
  for (const icon of document.querySelectorAll<HTMLLinkElement>("link[data-theme-icon]")) {
    void applyThemedIconElement(icon, scheme);
  }
}
