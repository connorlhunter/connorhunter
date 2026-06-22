import {
  anchorCollapsed,
  drawerAnchor,
  setAnchorCollapsed,
} from "./file-viewer-drawer-anchor";
import {
  anchorCollapseThreshold,
  drawerLegacyMobileCollapsedHeight,
  drawerMagnetDistance,
  drawerMagnetReleaseDistance,
} from "./file-viewer-drawer-config";
import {
  clampFileViewerDrawerHeight,
  drawerCollapsedHeight,
  drawerContentHeight,
  drawerSnapHeights,
} from "./file-viewer-drawer-measure";
import {
  readDrawerStateSnapshot,
  writeDrawerStateSnapshot,
  type DrawerStateSnapshot,
} from "./file-viewer-drawer-state";

export interface SetDrawerHeightOptions {
  readonly allowAnchorCollapse?: boolean;
  readonly magnetLockHeight?: number | null;
  readonly magnet?: boolean;
  readonly snap?: boolean;
  readonly stateKey?: string;
}

export type DrawerHeightOptionsWithoutStateKey = Omit<SetDrawerHeightOptions, "stateKey">;

export interface DrawerHeightState {
  readonly height: number;
  readonly magnetized: boolean;
}

/**
 * @param stateKey - Optional stable drawer state key.
 * @returns Options with state persistence only when a key is present.
 */
export function drawerStateOptions(stateKey: string | undefined): SetDrawerHeightOptions {
  return stateKey ? { stateKey } : {};
}

/**
 * @param options - Height options without persistence state.
 * @param stateKey - Optional stable drawer state key.
 * @returns Height options with state persistence only when a key is present.
 */
export function drawerHeightOptions(
  options: DrawerHeightOptionsWithoutStateKey,
  stateKey: string | undefined,
): SetDrawerHeightOptions {
  return stateKey ? { ...options, stateKey } : options;
}

/**
 * @param snapshot - Persisted drawer state.
 * @param contentHeight - Current measured drawer content height.
 * @returns Drawer height normalized for the current collapsed-height rules.
 */
function restoredDrawerHeight(snapshot: DrawerStateSnapshot, contentHeight: number): number {
  if (snapshot.full) {
    return contentHeight;
  }

  return snapshot.height <= drawerLegacyMobileCollapsedHeight
    ? drawerCollapsedHeight()
    : snapshot.height;
}

/**
 * @param drawer - Drawer element to update.
 * @param handle - Resize handle that reports expanded state.
 * @param height - Requested drawer height.
 */
export function setDrawerHeight(
  drawer: HTMLElement,
  handle: HTMLButtonElement,
  height: number,
  anchor = drawerAnchor(drawer),
  options: SetDrawerHeightOptions = {},
): DrawerHeightState {
  const collapsedHeight = drawerCollapsedHeight();
  const hideAnchor = height < anchorCollapseThreshold;
  const allowAnchorCollapse = options.allowAnchorCollapse ?? false;
  const magnet = options.magnet ?? false;
  const snap = options.snap ?? true;
  const snapHeights = snap || magnet ? drawerSnapHeights(drawer) : [];
  const contentHeight = drawerContentHeight(drawer);

  if (height > collapsedHeight) {
    setAnchorCollapsed(anchor, false);
  } else if (allowAnchorCollapse && hideAnchor) {
    setAnchorCollapsed(anchor, true);
  }

  const clampedHeight = clampFileViewerDrawerHeight(
    contentHeight,
    height,
    window.innerHeight,
    collapsedHeight,
    snapHeights,
    !snap,
    magnet ? drawerMagnetDistance : 0,
    options.magnetLockHeight ?? null,
    drawerMagnetReleaseDistance,
  );
  const collapsed = clampedHeight === collapsedHeight;
  const anchorIsCollapsed = anchorCollapsed(anchor);
  const magnetized =
    magnet && (Math.abs(clampedHeight - height) > 0.5 || (allowAnchorCollapse && hideAnchor));

  drawer.style.height = `${clampedHeight}px`;
  drawer.classList.toggle("file-viewer-drawer--collapsed", collapsed);
  drawer.classList.toggle("file-viewer-drawer--anchor-collapsed", anchorIsCollapsed);
  drawer.classList.toggle("file-viewer-drawer--magnetized", magnetized);
  handle.setAttribute("aria-expanded", String(!collapsed));
  handle.setAttribute(
    "aria-label",
    anchorIsCollapsed
      ? "Expand viewer sections"
      : collapsed
        ? anchor
          ? "Collapse viewer sections"
          : "Expand viewer drawer"
        : "Collapse viewer drawer",
  );

  if (options.stateKey) {
    writeDrawerStateSnapshot(options.stateKey, {
      anchorCollapsed: anchorIsCollapsed,
      full: clampedHeight >= contentHeight - 1,
      height: clampedHeight,
    });
  }

  return { height: clampedHeight, magnetized };
}

/**
 * @param drawer - Drawer element to restore.
 * @param handle - Resize handle for aria state.
 * @param stateKey - Stable key used to look up the last drawer state.
 * @returns Nothing; missing state is ignored.
 */
export function restoreDrawerState(
  drawer: HTMLElement,
  handle: HTMLButtonElement,
  stateKey: string | undefined,
): void {
  if (!stateKey) {
    return;
  }

  const snapshot = readDrawerStateSnapshot(stateKey);
  if (!snapshot) {
    return;
  }

  const anchor = drawerAnchor(drawer);
  const contentHeight = drawerContentHeight(drawer);

  setAnchorCollapsed(anchor, snapshot.anchorCollapsed);
  setDrawerHeight(drawer, handle, restoredDrawerHeight(snapshot, contentHeight), anchor, {
    stateKey,
  });
}
