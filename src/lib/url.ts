/**
 * @param href - Link href to classify.
 * @returns Whether the href should be treated as external or app-exiting.
 */
export function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}
