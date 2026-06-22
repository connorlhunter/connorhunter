import type { NavigationItem, PortfolioContent } from "./schema";

/**
 * @param content - Portfolio content containing navigation records.
 * @param href - Page href to look up.
 * @returns The navigation record for the requested page.
 */
export function navigationPage(
  content: Pick<PortfolioContent, "navigation">,
  href: string,
): NavigationItem {
  const item = content.navigation.find((navigationItem) => navigationItem.href === href);

  if (!item) {
    throw new Error(`Missing navigation content for page: ${href}`);
  }

  return item;
}
