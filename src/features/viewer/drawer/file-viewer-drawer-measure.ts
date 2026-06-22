import {
  drawerDesktopCollapsedHeight,
  drawerExpandedMinHeight,
  drawerMaxViewportRatio,
  drawerMobileCollapsedHeight,
  drawerMobileMediaQuery,
  drawerSectionSelector,
  dragThreshold,
  mobileDragThreshold,
} from "./file-viewer-drawer-config";

/**
 * @param contentHeight - Measured drawer content height.
 * @param height - Requested drawer height.
 * @param viewportHeight - Current viewport height.
 * @returns Requested height clamped to the drawer's usable range.
 */
export function clampFileViewerDrawerHeight(
  contentHeight: number,
  height: number,
  viewportHeight: number,
  collapsedHeight = drawerDesktopCollapsedHeight,
  snapHeights: ReadonlyArray<number> = [],
  allowPartial = false,
  magnetDistance = 0,
  magnetLockHeight: number | null = null,
  magnetReleaseDistance = magnetDistance,
): number {
  const maxViewportHeight = Math.max(
    drawerExpandedMinHeight,
    Math.round(viewportHeight * drawerMaxViewportRatio),
  );
  const maxHeight = Math.min(maxViewportHeight, Math.max(collapsedHeight, contentHeight));
  const expandedMinHeight = Math.min(drawerExpandedMinHeight, maxHeight);
  const clampedHeight = Math.min(maxHeight, Math.max(collapsedHeight, height));

  if (clampedHeight === collapsedHeight) {
    return collapsedHeight;
  }

  const snapPoints = [
    collapsedHeight,
    ...snapHeights.filter((snapHeight) => snapHeight > collapsedHeight && snapHeight < maxHeight),
    maxHeight,
  ].sort((left, right) => left - right);

  if (allowPartial) {
    if (magnetDistance <= 0) {
      return clampedHeight;
    }

    if (
      magnetLockHeight !== null &&
      snapPoints.includes(magnetLockHeight) &&
      Math.abs(magnetLockHeight - clampedHeight) <= magnetReleaseDistance
    ) {
      return magnetLockHeight;
    }

    const nearestSnapPoint = snapPoints.reduce((nearest, snapHeight) =>
      Math.abs(snapHeight - clampedHeight) < Math.abs(nearest - clampedHeight)
        ? snapHeight
        : nearest,
    );

    return Math.abs(nearestSnapPoint - clampedHeight) <= magnetDistance
      ? nearestSnapPoint
      : clampedHeight;
  }

  if (snapHeights.length > 0) {
    return snapPoints.reduce((nearest, snapHeight) =>
      Math.abs(snapHeight - clampedHeight) < Math.abs(nearest - clampedHeight)
        ? snapHeight
        : nearest,
    );
  }

  return clampedHeight < expandedMinHeight ? collapsedHeight : clampedHeight;
}

/**
 * @returns Collapsed drawer height for the current layout.
 */
export function drawerCollapsedHeight(): number {
  return window.matchMedia(drawerMobileMediaQuery).matches
    ? drawerMobileCollapsedHeight
    : drawerDesktopCollapsedHeight;
}

/**
 * @returns Movement distance before pointer gestures start resizing the drawer.
 */
export function drawerDragThreshold(): number {
  return window.matchMedia(drawerMobileMediaQuery).matches ? mobileDragThreshold : dragThreshold;
}

/**
 * @param drawer - Drawer element to measure.
 * @returns The natural drawer height without collapsed clipping.
 */
export function drawerContentHeight(drawer: HTMLElement): number {
  const previousHeight = drawer.style.height;
  const wasCollapsed = drawer.classList.contains("file-viewer-drawer--collapsed");

  drawer.classList.remove("file-viewer-drawer--collapsed");
  drawer.style.height = "auto";
  const contentHeight = Math.ceil(drawer.scrollHeight);
  drawer.style.height = previousHeight;
  drawer.classList.toggle("file-viewer-drawer--collapsed", wasCollapsed);

  return Math.max(drawerCollapsedHeight(), contentHeight);
}

/**
 * @param content - Drawer content element whose bottom padding should remain visible when snapped.
 * @returns The bottom padding, rounded up to whole pixels.
 */
function drawerContentBottomPadding(content: HTMLElement): number {
  const paddingBottom = Number.parseFloat(window.getComputedStyle(content).paddingBottom);

  return Number.isFinite(paddingBottom) ? Math.ceil(paddingBottom) : 0;
}

/**
 * @param drawer - Drawer element containing optional stepped sections.
 * @returns Cumulative drawer heights for section-by-section snapping.
 */
export function drawerSnapHeights(drawer: HTMLElement): ReadonlyArray<number> {
  const content = drawer.querySelector<HTMLElement>(".file-viewer-drawer-content");
  if (!content) return [];

  const previousHeight = drawer.style.height;
  const wasCollapsed = drawer.classList.contains("file-viewer-drawer--collapsed");

  drawer.classList.remove("file-viewer-drawer--collapsed");
  drawer.style.height = "auto";

  const bottomPadding = drawerContentBottomPadding(content);
  const sections = [...content.querySelectorAll<HTMLElement>(drawerSectionSelector)];
  const snapHeights = sections
    .map((section, index) => {
      const paddedHeight = Math.ceil(section.offsetTop + section.scrollHeight + bottomPadding);
      const nextSection = sections[index + 1];

      return nextSection ? Math.min(paddedHeight, Math.ceil(nextSection.offsetTop)) : paddedHeight;
    })
    .filter((height) => height > drawerCollapsedHeight());

  drawer.style.height = previousHeight;
  drawer.classList.toggle("file-viewer-drawer--collapsed", wasCollapsed);

  return snapHeights;
}

/**
 * @param drawer - Drawer element whose height is being reduced.
 * @returns The next lower drawer height that preserves a complete section.
 */
export function previousDrawerSnapHeight(drawer: HTMLElement): number {
  const collapsedHeight = drawerCollapsedHeight();
  const currentHeight = drawer.getBoundingClientRect().height || drawerContentHeight(drawer);
  const snapHeights = drawerSnapHeights(drawer)
    .filter((height) => height < currentHeight - 1)
    .sort((left, right) => left - right);

  return snapHeights.at(-1) ?? collapsedHeight;
}
