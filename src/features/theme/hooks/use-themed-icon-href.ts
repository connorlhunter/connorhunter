import { useEffect, useState } from "react";
import type { ThemeScheme } from "../theme";
import { themedIconHref } from "../theme-icon-loader";

/**
 * @param href - Standard SVG icon href.
 * @param scheme - Current theme scheme, when available.
 * @returns A theme-tinted icon href when a theme provider is present.
 */
export function useThemedIconHref(href: string, scheme: ThemeScheme | null): string {
  const [themedHref, setThemedHref] = useState(href);

  useEffect(() => {
    let cancelled = false;

    setThemedHref(href);

    if (!scheme) {
      return () => {
        cancelled = true;
      };
    }

    void themedIconHref(href).then((nextHref) => {
      if (!cancelled && document.documentElement.dataset.scheme === scheme.id) {
        setThemedHref(nextHref);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [href, scheme]);

  return themedHref;
}
