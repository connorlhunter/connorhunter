import {
  anchorCollapsed,
  drawerAnchor,
  setAnchorCollapsed,
} from "./file-viewer-drawer-anchor";
import {
  anchorCollapseThreshold,
  drawerMagnetDistance,
  drawerMagnetReleaseDistance,
} from "./file-viewer-drawer-config";
import {
  drawerHeightOptions,
  setDrawerHeight,
  toggleDrawer,
} from "./file-viewer-drawer-geometry";
import { drawerContentHeight, drawerDragThreshold } from "./file-viewer-drawer-measure";
import { createDrawerResizeController } from "./file-viewer-drawer-resize";

interface InstallFileViewerDrawerDragOptions {
  readonly drawer: HTMLDivElement;
  readonly draggingRef: { current: boolean };
  readonly handle: HTMLButtonElement;
  readonly stateKey?: string | undefined;
}

/**
 * @param options - Drawer nodes, drag ref, and optional state key.
 * @returns Cleanup callback that removes listeners and transient drag state.
 */
export function installFileViewerDrawerDrag({
  drawer,
  draggingRef,
  handle,
  stateKey,
}: InstallFileViewerDrawerDragOptions): () => void {
  let activePointerId = 0;
  let anchorCollapseLocked = false;
  let dragging = false;
  let moved = false;
  let startHeight = 0;
  let startedCollapsed = false;
  let startY = 0;
  const resize = createDrawerResizeController({ drawer, handle, stateKey });

  function stopDragging(event: PointerEvent): void {
    if (!dragging) {
      return;
    }

    dragging = false;
    draggingRef.current = false;
    const pendingResize = resize.snapshot();
    const releaseAnchorCollapsed = anchorCollapseLocked || anchorCollapsed(drawerAnchor(drawer));
    const releaseHeight = releaseAnchorCollapsed
      ? anchorCollapseThreshold - 1
      : (pendingResize.height ?? drawer.getBoundingClientRect().height);
    const releaseAllowsAnchorCollapse =
      pendingResize.allowAnchorCollapse || releaseAnchorCollapsed;
    resize.cancel();
    anchorCollapseLocked = false;
    setDrawerHeight(
      drawer,
      handle,
      releaseHeight,
      undefined,
      drawerHeightOptions(
        {
          allowAnchorCollapse: releaseAllowsAnchorCollapse,
          snap: true,
        },
        stateKey,
      ),
    );

    if (
      activePointerId &&
      typeof handle.hasPointerCapture === "function" &&
      handle.hasPointerCapture(activePointerId)
    ) {
      handle.releasePointerCapture(activePointerId);
    }

    activePointerId = 0;
    document.documentElement.classList.remove("is-resizing-file-viewer-drawer");
    event.preventDefault();
  }

  function onPointerDown(event: PointerEvent): void {
    dragging = true;
    draggingRef.current = true;
    moved = false;
    activePointerId = event.pointerId;
    startY = event.clientY;
    const measuredHeight = drawer.getBoundingClientRect().height;
    startHeight = Number.isFinite(measuredHeight) ? measuredHeight : drawerContentHeight(drawer);
    startedCollapsed = drawer.classList.contains("file-viewer-drawer--collapsed");
    resize.cancel();
    anchorCollapseLocked = false;
    anchorCollapseLocked = anchorCollapsed(drawerAnchor(drawer));
    if (typeof handle.setPointerCapture === "function") {
      handle.setPointerCapture(activePointerId);
    }
    document.documentElement.classList.add("is-resizing-file-viewer-drawer");
    event.preventDefault();
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging) {
      return;
    }

    const deltaY = event.clientY - startY;
    const requestedHeight = startHeight + deltaY;
    moved = moved || Math.abs(deltaY) > drawerDragThreshold();
    if (!moved) {
      event.preventDefault();
      return;
    }

    if (
      requestedHeight <= -drawerMagnetDistance ||
      ((startedCollapsed || anchorCollapseLocked) && deltaY <= -drawerMagnetDistance)
    ) {
      anchorCollapseLocked = true;
    } else if (
      anchorCollapseLocked &&
      (requestedHeight >= drawerMagnetReleaseDistance || deltaY >= drawerMagnetReleaseDistance)
    ) {
      anchorCollapseLocked = false;
    }

    resize.request(
      anchorCollapseLocked ? anchorCollapseThreshold - 1 : requestedHeight,
      false,
      anchorCollapseLocked,
    );
    event.preventDefault();
  }

  function onClick(event: MouseEvent): void {
    if (moved) {
      moved = false;
      event.preventDefault();
      return;
    }

    toggleDrawer(drawer, handle, stateKey);
  }

  function onResize(): void {
    resize.request();
  }

  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", stopDragging);
  handle.addEventListener("pointercancel", stopDragging);
  handle.addEventListener("click", onClick);
  window.addEventListener("resize", onResize);

  return () => {
    resize.cancel();
    handle.removeEventListener("pointerdown", onPointerDown);
    handle.removeEventListener("pointermove", onPointerMove);
    handle.removeEventListener("pointerup", stopDragging);
    handle.removeEventListener("pointercancel", stopDragging);
    handle.removeEventListener("click", onClick);
    window.removeEventListener("resize", onResize);
    setAnchorCollapsed(drawerAnchor(drawer), false);
    document.documentElement.classList.remove("is-resizing-file-viewer-drawer");
  };
}
