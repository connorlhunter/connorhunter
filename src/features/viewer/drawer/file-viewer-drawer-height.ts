import { anchorCollapsed, drawerAnchor, setAnchorCollapsed } from "./file-viewer-drawer-anchor";
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
  measureFileViewerDrawer,
  type FileViewerDrawerMeasurements,
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
  readonly measurements?: FileViewerDrawerMeasurements;
  readonly snap?: boolean;
  readonly stateKey?: string;
}

export type DrawerHeightOptionsWithoutStateKey = Omit<SetDrawerHeightOptions, "stateKey">;

export interface DrawerHeightState {
  readonly height: number;
  readonly magnetized: boolean;
}

interface DrawerHeightContext {
  readonly allowAnchorCollapse: boolean;
  readonly anchor: HTMLElement | null;
  readonly collapsedHeight: number;
  readonly contentHeight: number;
  readonly height: number;
  readonly hideAnchor: boolean;
  readonly magnet: boolean;
  readonly magnetLockHeight: number | null;
  readonly measurements: FileViewerDrawerMeasurements;
  readonly snap: boolean;
  readonly snapHeights: ReadonlyArray<number>;
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

function drawerHeightContext(
  drawer: HTMLElement,
  height: number,
  anchor: HTMLElement | null,
  options: SetDrawerHeightOptions,
): DrawerHeightContext {
  const magnet = options.magnet ?? false;
  const snap = options.snap ?? true;
  const measurements = options.measurements ?? measureFileViewerDrawer(drawer);

  return {
    allowAnchorCollapse: options.allowAnchorCollapse ?? false,
    anchor,
    collapsedHeight: drawerCollapsedHeight(),
    contentHeight: measurements.contentHeight,
    height,
    hideAnchor: height < anchorCollapseThreshold,
    magnet,
    magnetLockHeight: options.magnetLockHeight ?? null,
    measurements,
    snap,
    snapHeights: snap || magnet ? measurements.snapHeights : [],
  };
}

function updateDrawerAnchor(context: DrawerHeightContext): void {
  if (context.height > context.collapsedHeight) {
    setAnchorCollapsed(context.anchor, false);
  } else if (context.allowAnchorCollapse && context.hideAnchor) {
    setAnchorCollapsed(context.anchor, true);
  }
}

function clampedDrawerHeight(context: DrawerHeightContext): number {
  return clampFileViewerDrawerHeight(
    context.contentHeight,
    context.height,
    context.measurements.viewportHeight,
    context.collapsedHeight,
    context.snapHeights,
    !context.snap,
    context.magnet ? drawerMagnetDistance : 0,
    context.magnetLockHeight,
    drawerMagnetReleaseDistance,
  );
}

function drawerHandleLabel(
  anchorIsCollapsed: boolean,
  collapsed: boolean,
  anchor: HTMLElement | null,
): string {
  if (anchorIsCollapsed) {
    return "Expand viewer sections";
  }

  if (!collapsed) {
    return "Collapse viewer drawer";
  }

  return anchor ? "Collapse viewer sections" : "Expand viewer drawer";
}

function applyDrawerHeight(
  drawer: HTMLElement,
  handle: HTMLButtonElement,
  height: number,
  collapsed: boolean,
  anchorIsCollapsed: boolean,
  magnetized: boolean,
  anchor: HTMLElement | null,
): void {
  drawer.style.height = `${height}px`;
  drawer.classList.toggle("file-viewer-drawer--collapsed", collapsed);
  drawer.classList.toggle("file-viewer-drawer--anchor-collapsed", anchorIsCollapsed);
  drawer.classList.toggle("file-viewer-drawer--magnetized", magnetized);
  handle.setAttribute("aria-expanded", String(!collapsed));
  handle.setAttribute("aria-label", drawerHandleLabel(anchorIsCollapsed, collapsed, anchor));
}

function persistDrawerHeight(
  stateKey: string | undefined,
  anchorIsCollapsed: boolean,
  clampedHeight: number,
  contentHeight: number,
): void {
  if (!stateKey) {
    return;
  }

  writeDrawerStateSnapshot(stateKey, {
    anchorCollapsed: anchorIsCollapsed,
    full: clampedHeight >= contentHeight - 1,
    height: clampedHeight,
  });
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
  const context = drawerHeightContext(drawer, height, anchor, options);

  updateDrawerAnchor(context);

  const clampedHeight = clampedDrawerHeight(context);
  const collapsed = clampedHeight === context.collapsedHeight;
  const anchorIsCollapsed = anchorCollapsed(anchor);
  const magnetized =
    context.magnet &&
    (Math.abs(clampedHeight - context.height) > 0.5 ||
      (context.allowAnchorCollapse && context.hideAnchor));

  applyDrawerHeight(
    drawer,
    handle,
    clampedHeight,
    collapsed,
    anchorIsCollapsed,
    magnetized,
    anchor,
  );
  persistDrawerHeight(options.stateKey, anchorIsCollapsed, clampedHeight, context.contentHeight);

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
