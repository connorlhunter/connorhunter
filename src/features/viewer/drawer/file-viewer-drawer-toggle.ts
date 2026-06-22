import {
  anchorCollapsed,
  drawerAnchor,
  setAnchorCollapsed,
} from "./file-viewer-drawer-anchor";
import { drawerStateOptions, setDrawerHeight } from "./file-viewer-drawer-height";
import {
  drawerCollapsedHeight,
  drawerContentHeight,
  previousDrawerSnapHeight,
} from "./file-viewer-drawer-measure";

/**
 * @param drawer - Drawer element to expand.
 * @param handle - Resize handle that reports expanded state.
 */
function expandDrawer(drawer: HTMLElement, handle: HTMLButtonElement, stateKey?: string): void {
  setAnchorCollapsed(drawerAnchor(drawer), false);
  setDrawerHeight(
    drawer,
    handle,
    drawerContentHeight(drawer),
    undefined,
    drawerStateOptions(stateKey),
  );
}

/**
 * @param drawer - Drawer element to collapse.
 * @param handle - Resize handle that reports expanded state.
 */
function collapseDrawer(drawer: HTMLElement, handle: HTMLButtonElement, stateKey?: string): void {
  setDrawerHeight(
    drawer,
    handle,
    previousDrawerSnapHeight(drawer),
    undefined,
    drawerStateOptions(stateKey),
  );
}

/**
 * @param drawer - Drawer whose adjacent header should be hidden.
 * @param handle - Resize handle that reports expanded state.
 */
function collapseDrawerAnchor(
  drawer: HTMLElement,
  handle: HTMLButtonElement,
  stateKey?: string,
): void {
  const anchor = drawerAnchor(drawer);

  setAnchorCollapsed(anchor, true);
  setDrawerHeight(drawer, handle, drawerCollapsedHeight(), anchor, drawerStateOptions(stateKey));
}

/**
 * @param drawer - Drawer element to toggle.
 * @param handle - Resize handle that reports expanded state.
 */
export function toggleDrawer(
  drawer: HTMLElement,
  handle: HTMLButtonElement,
  stateKey?: string,
): void {
  const anchor = drawerAnchor(drawer);
  const drawerCollapsed = drawer.classList.contains("file-viewer-drawer--collapsed");

  if (anchorCollapsed(anchor)) {
    expandDrawer(drawer, handle, stateKey);
    return;
  }

  if (drawerCollapsed) {
    if (anchor) {
      collapseDrawerAnchor(drawer, handle, stateKey);
      return;
    }

    expandDrawer(drawer, handle, stateKey);
    return;
  }

  collapseDrawer(drawer, handle, stateKey);
}
