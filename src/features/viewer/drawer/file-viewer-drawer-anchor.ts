/**
 * @param drawer - Drawer element with an optional explicit header anchor id.
 * @returns The configured anchor element, or the previous file viewer header element.
 */
export function drawerAnchor(drawer: HTMLElement): HTMLElement | null {
  const explicitAnchorId = drawer.dataset.fileViewerDrawerAnchor;
  const explicitAnchor = explicitAnchorId ? document.getElementById(explicitAnchorId) : null;
  if (explicitAnchor instanceof HTMLElement) {
    return explicitAnchor;
  }

  const anchor = drawer.previousElementSibling;

  return anchor instanceof HTMLElement ? anchor : null;
}

/**
 * @param anchor - Header anchor above the drawer.
 * @param collapsed - Whether the header anchor should be hidden.
 */
export function setAnchorCollapsed(anchor: HTMLElement | null, collapsed: boolean): void {
  anchor?.classList.toggle("file-viewer-drawer-anchor--collapsed", collapsed);
}

/**
 * @param anchor - Header anchor above the drawer.
 * @returns Whether the header anchor is hidden.
 */
export function anchorCollapsed(anchor: HTMLElement | null): boolean {
  return anchor?.classList.contains("file-viewer-drawer-anchor--collapsed") ?? false;
}
